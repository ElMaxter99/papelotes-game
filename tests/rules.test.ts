import { describe, it, expect, beforeEach } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { createPglite, rpc } from '@/lib/db/pglite';

const HOST = '11111111-1111-1111-1111-111111111111';
const IDEAS = [
  { title: 'Una casa', emoji: '🏠', difficulty: 1 },
  { title: 'Homer Simpson', image_url: 'https://example.com/h.jpg', difficulty: 3 },
  { title: 'Un perro' },
];

async function setup(db: PGlite, players = ['Ana', 'Luis', 'Marta']) {
  const { room_code } = await rpc<{ room_code: string }>(db, 'pa_create_game', { host_id: HOST, name: 'Sábado' });
  await rpc(db, 'pa_configure_game', { room_code, host_id: HOST, ideas: IDEAS, rounds_total: 3 });
  const tokens: Record<string, string> = {};
  for (const n of players) {
    tokens[n] = `tok-${n}`;
    await rpc(db, 'pa_join_new_player', { room_code, name: n, token_hash: tokens[n] });
  }
  return { room_code, tokens };
}
const state = (db: PGlite, room_code: string) => rpc<any>(db, 'pa_get_state', { room_code, view: 'public' });
const advance = (db: PGlite, room_code: string) => rpc<any>(db, 'pa_advance_phase', { room_code, host_id: HOST });

describe('reglas de Papelotes', () => {
  let db: PGlite;
  beforeEach(async () => { db = await createPglite(); });

  it('no empieza con menos de 2 jugadores ni sin ideas', async () => {
    const { room_code } = await rpc<{ room_code: string }>(db, 'pa_create_game', { host_id: HOST, name: 'X' });
    await expect(rpc(db, 'pa_configure_game', { room_code, host_id: HOST, ideas: [] })).rejects.toMatchObject({ code: 'no_ideas' });
    await rpc(db, 'pa_configure_game', { room_code, host_id: HOST, ideas: IDEAS });
    await rpc(db, 'pa_join_new_player', { room_code, name: 'Ana', token_hash: 't1' });
    await expect(rpc(db, 'pa_start_round', { room_code, host_id: HOST })).rejects.toMatchObject({ code: 'not_enough_players' });
  });

  it('solo el anfitrión avanza la partida', async () => {
    const { room_code } = await setup(db);
    await expect(rpc(db, 'pa_start_round', { room_code, host_id: '22222222-2222-2222-2222-222222222222' })).rejects.toMatchObject({ code: 'not_host' });
  });

  it('una ronda completa: dibujo, fotos, anonimato, votos, puntos y sin foto', async () => {
    const { room_code, tokens } = await setup(db);
    await rpc(db, 'pa_start_round', { room_code, host_id: HOST });
    let s = await state(db, room_code);
    expect(s.round.phase).toBe('idea');
    expect(s.round.idea.title).toBe('Una casa');

    await advance(db, room_code); // dibujo
    await rpc(db, 'pa_submit_drawing', { room_code, token_hash: tokens.Ana, image_path: 'a.webp' });
    await rpc(db, 'pa_submit_drawing', { room_code, token_hash: tokens.Luis, image_path: 'l.webp' });
    await advance(db, room_code); // subida (Marta no entrega)
    await advance(db, room_code); // revelación
    s = await state(db, room_code);
    expect(s.round.phase).toBe('reveal');
    expect(s.round.drawings).toHaveLength(2);
    // anonimato: no aparece el autor ni los votos
    for (const d of s.round.drawings) { expect(d.player_id).toBeNull(); expect(d.votes).toBeNull(); }

    await advance(db, room_code); // votación
    s = await state(db, room_code);
    const byId = (n: string) => s.players.find((p: any) => p.name === n).id;
    const dAna = await db.query<{ id: string }>(`select id from drawings where player_id = $1`, [byId('Ana')]);
    const dLuis = await db.query<{ id: string }>(`select id from drawings where player_id = $1`, [byId('Luis')]);
    await expect(rpc(db, 'pa_vote', { room_code, token_hash: tokens.Ana, drawing_id: dAna.rows[0].id })).rejects.toMatchObject({ code: 'own_drawing' });
    await rpc(db, 'pa_vote', { room_code, token_hash: tokens.Luis, drawing_id: dAna.rows[0].id });
    await rpc(db, 'pa_vote', { room_code, token_hash: tokens.Marta, drawing_id: dAna.rows[0].id });
    await rpc(db, 'pa_vote', { room_code, token_hash: tokens.Ana, drawing_id: dLuis.rows[0].id });

    await advance(db, room_code); // resultado
    s = await state(db, room_code);
    expect(s.round.phase).toBe('result');
    const score = (n: string) => s.players.find((p: any) => p.name === n).score;
    expect(score('Ana')).toBe(2 * 100 + 50);
    expect(score('Luis')).toBe(1 * 100 + 50);
    expect(score('Marta')).toBe(0); // sin foto, sin puntos
    expect(s.round.drawings.every((d: any) => d.player_id)).toBe(true);
    // avanzar otra vez no puntúa dos veces
    await expect(advance(db, room_code)).rejects.toMatchObject({ code: 'no_open_round' });
    s = await state(db, room_code);
    expect(s.players.find((p: any) => p.name === 'Ana').score).toBe(250);
  });

  it('no se puede entregar ni votar fuera de fase', async () => {
    const { room_code, tokens } = await setup(db);
    await rpc(db, 'pa_start_round', { room_code, host_id: HOST });
    await expect(rpc(db, 'pa_submit_drawing', { room_code, token_hash: tokens.Ana, image_path: 'a.webp' })).rejects.toMatchObject({ code: 'phase_closed' });
    await expect(rpc(db, 'pa_vote', { room_code, token_hash: tokens.Ana, drawing_id: '33333333-3333-3333-3333-333333333333' })).rejects.toMatchObject({ code: 'phase_closed' });
  });

  it('nadie entrega: se salta la votación y la partida sigue con la ronda siguiente y termina', async () => {
    const { room_code } = await setup(db);
    for (let r = 1; r <= 3; r++) {
      await rpc(db, 'pa_start_round', { room_code, host_id: HOST });
      await advance(db, room_code); await advance(db, room_code); await advance(db, room_code);
      const s = await state(db, room_code);
      expect(s.round.phase).toBe('result');
      expect(s.round.number).toBe(r);
    }
    await expect(rpc(db, 'pa_start_round', { room_code, host_id: HOST })).rejects.toMatchObject({ code: 'no_more_rounds' });
    await rpc(db, 'pa_game_status', { room_code, host_id: HOST, status: 'finished' });
  });
});
