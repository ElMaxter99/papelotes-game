'use client';
import { useGame } from '../use-game';
import { Timer } from '../Timer';
import type { DrawingView, Snapshot } from '@/lib/domain/types';

function Pics({ ds, snap, showResult }: { ds: DrawingView[]; snap: Snapshot; showResult?: boolean }) {
  const name = (id: string | null) => snap.players.find((p) => p.id === id)?.name;
  return (
    <div className="pics">
      {ds.map((d) => (
        <div key={d.id} className={`pic img fade${showResult && d.points === Math.max(...ds.map((x) => x.points ?? 0)) ? ' win' : ''}`}>
          <em>{d.order}</em>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/images/${d.image_path}`} alt={`Dibujo ${d.order}`} />
          {showResult && <span style={{ position: 'absolute', bottom: 4, left: 4, right: 4, background: '#fff', border: '2px solid #1B2440', borderRadius: 6, textAlign: 'center' }}>{name(d.player_id)} · {d.votes} {d.votes === 1 ? 'voto' : 'votos'}</span>}
        </div>
      ))}
    </div>
  );
}

export function Screen({ code }: { code: string }) {
  const { snap, error } = useGame(code);
  if (!snap) return <main className="s tvfull" aria-busy="true"><div className="skel" style={{ width: '40%', height: 40 }} />{error && <p className="err">{error}</p>}</main>;
  const { game, round, players } = snap;
  const joined = players.filter((p) => p.joined && !p.retired);
  const sub = new Set(round?.submitted ?? []);
  return (
    <main className="s tvfull">
      <div className="bar"><span>PAPELOTES · {game.name}</span><span>Sala {game.room_code}{round ? ` · Ronda ${round.number} de ${game.rounds_total}` : ''}</span></div>
      {error && <p className="err">{error}</p>}
      {game.status === 'lobby' && (
        <div className="fade col"><h1 className="h1">Entra con tu móvil</h1>
          <p style={{ fontSize: '2.4em', fontWeight: 800, margin: 0 }}>/join · código {game.room_code}</p>
          <div className="row">{joined.map((p) => <span key={p.id} className="chip ok">{p.name}</span>)}{joined.length === 0 && <span className="chip wait">Esperando jugadores…</span>}</div>
          <p className="mut">Coged papel y un rotulador gordo.</p></div>)}
      {game.status === 'finished' && (
        <div className="fade col grow"><h1 className="h1">Fin de partida</h1>
          <div className="podium">{[...joined].sort((a, b) => b.score - a.score).slice(0, 3).map((p, i) => <div key={p.id} style={{ paddingTop: (3 - i) * 12 }}>{i + 1}.º {p.name}<br />{p.score}</div>)}</div></div>)}
      {round && game.status === 'active' && round.phase === 'idea' && (
        <div className="fade col"><p className="mut" style={{ fontSize: '1.4em' }}>Dibuja…</p><div className="idea">{round.idea.image_url && <span className="ph" style={{ width: 120, height: 120 }} />}{round.idea.emoji} {round.idea.title}</div></div>)}
      {round && game.status === 'active' && round.phase === 'drawing' && (
        <div className="fade col"><div className="bar"><span>{round.idea.emoji} {round.idea.title}</span><span>A dibujar</span></div><Timer endsAt={round.phase_ends_at} serverTime={snap.server_time} />
          <div className="row">{joined.map((p) => <span key={p.id} className={`chip ${sub.has(p.id) ? 'ok' : ''}`}>{p.name}{sub.has(p.id) ? ' ✓' : ''}</span>)}</div></div>)}
      {round && game.status === 'active' && round.phase === 'upload' && (
        <div className="fade col"><h1 className="h1">Haced la foto a vuestro papel</h1><Timer endsAt={round.phase_ends_at} serverTime={snap.server_time} />
          <div className="prog"><i style={{ width: `${(100 * sub.size) / Math.max(1, joined.length)}%` }} /></div><p className="mut">{sub.size} de {joined.length} fotos subidas</p></div>)}
      {round && game.status === 'active' && (round.phase === 'reveal' || round.phase === 'vote' || round.phase === 'result') && (
        <div className="fade col grow"><div className="bar"><span>{round.idea.emoji} {round.idea.title}</span><span>{round.phase === 'vote' ? `${round.voted.length} de ${joined.length} han votado` : round.phase === 'result' ? 'Resultado' : 'Dibujos anónimos'}</span></div>
          {round.drawings.length ? <Pics ds={round.drawings} snap={snap} showResult={round.phase === 'result'} /> : <p className="h1">Nadie ha entregado dibujo esta ronda.</p>}
          {round.phase === 'result' && <div className="bar"><span>{[...joined].sort((a, b) => b.score - a.score).map((p) => `${p.name} ${p.score}`).join(' · ')}</span></div>}</div>)}
    </main>
  );
}
