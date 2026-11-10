'use client';
import { useState } from 'react';
import { post, useGame } from '../use-game';
import { Timer } from '../Timer';

const NEXT: Record<string, string> = { idea: 'Empezar a dibujar', drawing: 'Cerrar el dibujo', upload: 'Cerrar la subida y revelar', reveal: 'Abrir la votación', vote: 'Cerrar la votación', result: 'Siguiente ronda' };

export function Host({ code }: { code: string }) {
  const { snap, error, refresh } = useGame(code, true);
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [confirmEnd, setConfirmEnd] = useState(false);
  async function act(body: object) {
    setBusy(true); setMsg(null); const r = await post(`/api/games/${code}/actions`, body); setBusy(false);
    if (!r.ok) setMsg(r.data.message ?? 'No se pudo hacer.'); refresh();
  }
  if (!snap) return <main className="s" aria-busy="true"><div className="skel" style={{ height: 24, width: '50%' }} />{error && <p className="err">{error}</p>}</main>;
  const { game, round, players } = snap; const joined = players.filter((p) => p.joined && !p.retired);
  const sub = new Set(round?.submitted ?? []);
  const lastResult = round?.phase === 'result' && game.current_round >= game.rounds_total;
  return (
    <main className="s">
      <div className="top"><span>Sala {game.room_code} · {game.name}</span><span className="grow" /><span className="chip">{round ? `Ronda ${round.number}/${game.rounds_total} · ${round.phase}` : game.status}</span></div>
      {error && <p className="err">{error}</p>}{msg && <p className="err" role="alert">{msg}</p>}
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="col" style={{ minWidth: 240, flex: 1 }}>
          {round && <Timer endsAt={round.phase_ends_at} serverTime={snap.server_time} />}
          {game.status === 'lobby' && <button className="btn" disabled={busy || joined.length < 2} onClick={() => act({ type: 'start_round' })}>Empezar la partida</button>}
          {game.status === 'lobby' && joined.length < 2 && <p className="mut">Hacen falta al menos 2 jugadores. Pásales el código {game.room_code}.</p>}
          {round && game.status === 'active' && !lastResult && <button className="btn" disabled={busy} onClick={() => act(round.phase === 'result' ? { type: 'start_round' } : { type: 'advance_phase' })}>{NEXT[round.phase]}</button>}
          {lastResult && <button className="btn" disabled={busy} onClick={() => act({ type: 'finish' })}>Terminar y ver el podio</button>}
          {game.status === 'active' && !confirmEnd && <button className="btn dan sm" onClick={() => setConfirmEnd(true)}>Terminar la partida</button>}
          {confirmEnd && <div className="modal" role="dialog" aria-label="Confirmar"><b className="h2">¿Terminar la partida?</b><span className="mut">Se pasará al podio. No se puede reanudar.</span>
            <div className="acts"><button className="btn sec sm" onClick={() => setConfirmEnd(false)}>Volver</button><button className="btn dan sm" onClick={() => { setConfirmEnd(false); act({ type: 'finish' }); }}>Terminar</button></div></div>}
        </div>
        <div className="col" style={{ flex: 1, minWidth: 240 }}>
          {players.map((p) => <div className="card" key={p.id}><b>{p.name}</b><span className="row"><span>{p.score} pts</span>
            {round && ['drawing', 'upload'].includes(round.phase) ? <span className={`chip ${sub.has(p.id) ? 'ok' : 'wait'}`}>{sub.has(p.id) ? 'Foto subida' : 'Dibujando'}</span> : <span className={`chip ${p.online ? 'ok' : 'bad'}`}>{p.online ? 'Conectado' : 'Desconectado'}</span>}</span></div>)}
          {players.length === 0 && <p className="mut">Aún no se ha unido nadie.</p>}
        </div>
      </div>
      <p className="mut">TV: <a href={`/game/${game.room_code}/screen`} target="_blank">/game/{game.room_code}/screen</a> · Jugadores: /game/{game.room_code}/play</p>
    </main>
  );
}
