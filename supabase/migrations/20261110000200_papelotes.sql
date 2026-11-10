-- =============================================================================
-- Papelotes · reglas del juego (rondas, dibujos en papel fotografiados, votos)
-- Toda la lógica vive aquí. TypeScript solo valida, autentica y presenta.
-- =============================================================================

alter table games
  add column rounds_total    integer not null default 8 check (rounds_total between 1 and 30),
  add column draw_seconds    integer not null default 90 check (draw_seconds between 30 and 300),
  add column upload_seconds  integer not null default 20 check (upload_seconds between 10 and 120),
  add column anonymous       boolean not null default true,
  add column current_round   integer not null default 0;

-- Ideas que se usarán en la partida (copia de las listas elegidas: editar una lista no cambia el historial)
create table game_ideas (
  game_id     uuid not null references games(id) on delete cascade,
  position    integer not null check (position >= 1),
  title       text not null check (char_length(title) between 1 and 80),
  emoji       text check (char_length(emoji) <= 8),
  image_url   text check (char_length(image_url) <= 500),
  difficulty  integer not null default 1 check (difficulty between 1 and 3),
  primary key (game_id, position)
);

create table rounds (
  id               uuid primary key default gen_random_uuid(),
  game_id          uuid not null references games(id) on delete cascade,
  number           integer not null check (number >= 1),
  idea_title       text not null,
  idea_emoji       text,
  idea_image_url   text,
  phase            text not null default 'idea' check (phase in ('idea','drawing','upload','reveal','vote','result')),
  phase_started_at timestamptz not null default clock_timestamp(),
  phase_ends_at    timestamptz,
  drawing_ends_at  timestamptz,
  created_at       timestamptz not null default now(),
  unique (game_id, number)
);

create table drawings (
  id           uuid primary key default gen_random_uuid(),
  round_id     uuid not null references rounds(id) on delete cascade,
  game_id      uuid not null references games(id) on delete cascade,
  player_id    uuid not null references players(id) on delete cascade,
  image_path   text,
  no_photo     boolean not null default false,
  on_time      boolean not null default false,
  submitted_at timestamptz not null default clock_timestamp(),
  votes        integer not null default 0,
  points       integer not null default 0,
  reveal_order integer,
  unique (round_id, player_id)
);

create table votes (
  round_id    uuid not null references rounds(id) on delete cascade,
  voter_id    uuid not null references players(id) on delete cascade,
  drawing_id  uuid not null references drawings(id) on delete cascade,
  created_at  timestamptz not null default clock_timestamp(),
  primary key (round_id, voter_id)
);

-- ---------------------------------------------------------------------------
-- Configurar partida (solo en sala)
-- p: room_code, host_id, rounds_total?, draw_seconds?, upload_seconds?, anonymous?, ideas: [{title,emoji,image_url,difficulty}]
-- ---------------------------------------------------------------------------
create or replace function pa_configure_game(p jsonb) returns jsonb language plpgsql as $$
declare g games; i int := 0; it jsonb; n int;
begin
  g := pa_lock_game(p->>'room_code', (p->>'host_id')::uuid);
  if g.status <> 'lobby' then perform pa_err('invalid_state'); end if;
  if jsonb_typeof(coalesce(p->'ideas', '[]'::jsonb)) <> 'array' then perform pa_err('invalid_input'); end if;
  n := jsonb_array_length(coalesce(p->'ideas', '[]'::jsonb));
  if n < 1 then perform pa_err('no_ideas'); end if;
  update games set
    rounds_total = least(coalesce((p->>'rounds_total')::int, rounds_total), n),
    draw_seconds = coalesce((p->>'draw_seconds')::int, draw_seconds),
    upload_seconds = coalesce((p->>'upload_seconds')::int, upload_seconds),
    anonymous = coalesce((p->>'anonymous')::boolean, anonymous)
  where id = g.id;
  delete from game_ideas where game_id = g.id;
  for it in select * from jsonb_array_elements(p->'ideas') loop
    i := i + 1;
    insert into game_ideas (game_id, position, title, emoji, image_url, difficulty)
    values (g.id, i, left(trim(it->>'title'), 80), nullif(it->>'emoji',''), nullif(it->>'image_url',''), coalesce((it->>'difficulty')::int, 1));
  end loop;
  perform pa_log(g.id, g.host_id, 'game_configured', jsonb_build_object('ideas', n));
  perform pa_touch(g.id);
  return jsonb_build_object('ideas', n);
end $$;

-- ---------------------------------------------------------------------------
-- Empezar la siguiente ronda (también arranca la partida desde la sala)
-- ---------------------------------------------------------------------------
create or replace function pa_start_round(p jsonb) returns jsonb language plpgsql as $$
declare g games; idea game_ideas; r rounds; active_players int;
begin
  g := pa_lock_game(p->>'room_code', (p->>'host_id')::uuid);
  if g.status not in ('lobby','active') then perform pa_err('invalid_state'); end if;
  if exists (select 1 from rounds where game_id = g.id and phase <> 'result') then perform pa_err('round_in_progress'); end if;
  select count(*) into active_players from players where game_id = g.id and joined_at is not null and retired_at is null;
  if active_players < 2 then perform pa_err('not_enough_players'); end if;
  if g.current_round >= g.rounds_total then perform pa_err('no_more_rounds'); end if;
  select * into idea from game_ideas where game_id = g.id and position = g.current_round + 1;
  if not found then perform pa_err('no_more_rounds'); end if;
  insert into rounds (game_id, number, idea_title, idea_emoji, idea_image_url)
  values (g.id, g.current_round + 1, idea.title, idea.emoji, idea.image_url) returning * into r;
  update games set status = 'active', current_round = r.number where id = g.id;
  perform pa_log(g.id, g.host_id, 'round_started', jsonb_build_object('round', r.number));
  perform pa_touch(g.id);
  return jsonb_build_object('round', r.number, 'phase', r.phase);
end $$;

-- Cálculo de puntos al cerrar la votación: 100 por voto, +50 por entregar a tiempo.
create or replace function pa_score_round(p_round uuid) returns void language plpgsql as $$
declare d record;
begin
  update drawings dr set votes = (select count(*) from votes v where v.drawing_id = dr.id) where dr.round_id = p_round;
  update drawings set points = votes * 100 + case when on_time and not no_photo then 50 else 0 end where round_id = p_round;
  for d in select player_id, points from drawings where round_id = p_round loop
    update players set score = score + d.points where id = d.player_id;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Avanzar de fase (anfitrión): idea → dibujo → subida → revelación → votación → resultado
-- ---------------------------------------------------------------------------
create or replace function pa_advance_phase(p jsonb) returns jsonb language plpgsql as $$
declare g games; r rounds; nxt text; k int; d record; missing int;
begin
  g := pa_lock_game(p->>'room_code', (p->>'host_id')::uuid);
  if g.status <> 'active' then perform pa_err('invalid_state'); end if;
  select * into r from rounds where game_id = g.id and number = g.current_round for update;
  if not found or r.phase = 'result' then perform pa_err('no_open_round'); end if;
  nxt := case r.phase when 'idea' then 'drawing' when 'drawing' then 'upload' when 'upload' then 'reveal' when 'reveal' then 'vote' else 'result' end;

  if r.phase = 'upload' then
    -- quien no subió foto queda «sin foto»
    insert into drawings (round_id, game_id, player_id, no_photo, on_time)
    select r.id, g.id, pl.id, true, false from players pl
     where pl.game_id = g.id and pl.joined_at is not null and pl.retired_at is null
       and not exists (select 1 from drawings dr where dr.round_id = r.id and dr.player_id = pl.id);
    -- orden de revelación aleatorio (anonimato)
    k := 0;
    for d in select id from drawings where round_id = r.id and not no_photo order by random() loop
      k := k + 1; update drawings set reveal_order = k where id = d.id;
    end loop;
    if k = 0 then nxt := 'result'; end if;  -- nadie subió: se salta la votación
  end if;

  if nxt = 'result' then
    if r.phase = 'vote' or r.phase = 'upload' then perform pa_score_round(r.id); end if;
  end if;

  update rounds set phase = nxt, phase_started_at = clock_timestamp(),
    phase_ends_at = case nxt when 'drawing' then clock_timestamp() + make_interval(secs => g.draw_seconds)
                             when 'upload' then clock_timestamp() + make_interval(secs => g.upload_seconds) else null end,
    drawing_ends_at = case when nxt = 'drawing' then clock_timestamp() + make_interval(secs => g.draw_seconds) else drawing_ends_at end
  where id = r.id;
  perform pa_log(g.id, g.host_id, 'phase_changed', jsonb_build_object('round', r.number, 'phase', nxt));
  perform pa_touch(g.id);
  return jsonb_build_object('round', r.number, 'phase', nxt);
end $$;

-- ---------------------------------------------------------------------------
-- Jugador: entregar la foto de su dibujo (permitido en dibujo y subida; se puede reemplazar)
-- p: room_code, token_hash, image_path
-- ---------------------------------------------------------------------------
create or replace function pa_submit_drawing(p jsonb) returns jsonb language plpgsql as $$
declare g games; r rounds; pl players; on_t boolean;
begin
  g := pa_lock_game_public(p->>'room_code');
  select * into pl from players where game_id = g.id and token_hash = p->>'token_hash';
  if not found then perform pa_err('player_not_found'); end if;
  if pl.retired_at is not null then perform pa_err('player_retired'); end if;
  if g.status <> 'active' then perform pa_err('invalid_state'); end if;
  select * into r from rounds where game_id = g.id and number = g.current_round for update;
  if not found or r.phase not in ('drawing','upload') then perform pa_err('phase_closed'); end if;
  if coalesce(p->>'image_path','') = '' or char_length(p->>'image_path') > 300 then perform pa_err('invalid_input'); end if;
  on_t := r.phase = 'drawing' or clock_timestamp() <= r.drawing_ends_at + interval '2 seconds';
  insert into drawings (round_id, game_id, player_id, image_path, on_time)
  values (r.id, g.id, pl.id, p->>'image_path', on_t)
  on conflict (round_id, player_id) do update set image_path = excluded.image_path, no_photo = false, submitted_at = clock_timestamp(),
    on_time = drawings.on_time and excluded.on_time;
  perform pa_log(g.id, pl.id, 'drawing_submitted', jsonb_build_object('round', r.number));
  perform pa_touch(g.id);
  return jsonb_build_object('ok', true);
end $$;

-- Jugador: votar (no el propio) durante la votación; se puede cambiar el voto
create or replace function pa_vote(p jsonb) returns jsonb language plpgsql as $$
declare g games; r rounds; pl players; dr drawings;
begin
  g := pa_lock_game_public(p->>'room_code');
  select * into pl from players where game_id = g.id and token_hash = p->>'token_hash';
  if not found then perform pa_err('player_not_found'); end if;
  select * into r from rounds where game_id = g.id and number = g.current_round for update;
  if not found or r.phase <> 'vote' then perform pa_err('phase_closed'); end if;
  select * into dr from drawings where id = (p->>'drawing_id')::uuid and round_id = r.id and not no_photo;
  if not found then perform pa_err('drawing_not_found'); end if;
  if dr.player_id = pl.id then perform pa_err('own_drawing'); end if;
  insert into votes (round_id, voter_id, drawing_id) values (r.id, pl.id, dr.id)
  on conflict (round_id, voter_id) do update set drawing_id = excluded.drawing_id, created_at = clock_timestamp();
  perform pa_log(g.id, pl.id, 'vote_cast', jsonb_build_object('round', r.number));
  perform pa_touch(g.id);
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------------
-- Instantánea: envoltorio sobre pa_get_state (patrón de la arquitectura común)
-- Secretos: autoría de los dibujos hasta el resultado (si es anónima), y votos individuales.
-- ---------------------------------------------------------------------------
alter function pa_get_state(jsonb) rename to pa_get_state_core;
create or replace function pa_get_state(p jsonb) returns jsonb language plpgsql as $$
declare s jsonb := pa_get_state_core(p); g games; r rounds; show_authors boolean; rj jsonb := null; ds jsonb := '[]'::jsonb;
begin
  select * into g from games where room_code = upper(coalesce(p->>'room_code',''));
  s := jsonb_set(s, '{game}', (s->'game') || jsonb_build_object(
    'rounds_total', g.rounds_total, 'draw_seconds', g.draw_seconds, 'upload_seconds', g.upload_seconds,
    'anonymous', g.anonymous, 'current_round', g.current_round));
  select * into r from rounds where game_id = g.id and number = g.current_round;
  if found then
    show_authors := r.phase = 'result' or not g.anonymous;
    rj := jsonb_build_object('number', r.number, 'phase', r.phase, 'phase_ends_at', r.phase_ends_at,
      'idea', jsonb_build_object('title', r.idea_title, 'emoji', r.idea_emoji, 'image_url', r.idea_image_url));
    if r.phase in ('reveal','vote','result') then
      select coalesce(jsonb_agg(jsonb_build_object(
          'id', d.id, 'order', d.reveal_order, 'image_path', d.image_path,
          'player_id', case when show_authors then d.player_id end,
          'votes', case when r.phase = 'result' then d.votes end,
          'points', case when r.phase = 'result' then d.points end
        ) order by d.reveal_order), '[]'::jsonb) into ds from drawings d where d.round_id = r.id and not d.no_photo;
    end if;
    rj := rj || jsonb_build_object('drawings', ds,
      'submitted', coalesce((select jsonb_agg(d.player_id) from drawings d where d.round_id = r.id and not d.no_photo), '[]'::jsonb),
      'voted', coalesce((select jsonb_agg(v.voter_id) from votes v where v.round_id = r.id), '[]'::jsonb));
  end if;
  s := s || jsonb_build_object('round', rj);
  return s;
end $$;
