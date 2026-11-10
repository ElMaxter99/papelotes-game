'use client';
import { useEffect, useRef, useState } from 'react';
import { post, useGame } from '../use-game';
import { Timer } from '../Timer';
import { Mascot } from '../brand/Mascot';

const COLORS = ['#2F5BEA', '#E83E8C', '#1FA971', '#FFD23F'];

export function Play({ code }: { code: string }) {
  const { snap, error, refresh } = useGame(code);
  const [me, setMe] = useState<string | null | undefined>(undefined);
  const [name, setName] = useState(''); const [color, setColor] = useState(COLORS[0]);
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch(`/api/play/${code}/me`).then((r) => r.json()).then((j) => setMe(j.player_id)).catch(() => setMe(null)); }, [code]);
  useEffect(() => { if (!me) return; const t = setInterval(() => post(`/api/play/${code}/ping`), 15000); return () => clearInterval(t); }, [me, code]);

  async function join(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await post(`/api/play/${code}/join`, { name, color }); setBusy(false);
    if (!r.ok) return setMsg(r.data.message ?? 'No se pudo entrar.');
    setMe(r.data.player_id); refresh();
  }
  async function send() {
    if (!preview) return; setBusy(true); setMsg(null);
    const fd = new FormData(); fd.set('photo', preview.file);
    const r = await post(`/api/play/${code}/drawing`, fd); setBusy(false);
    if (!r.ok) return setMsg(r.data.message ?? 'No se pudo enviar la foto. Tu foto sigue aquí; reintenta.');
    setPreview(null); refresh();
  }
  async function vote(id: string) {
    setBusy(true); setMsg(null); const r = await post(`/api/play/${code}/vote`, { drawing_id: id }); setBusy(false);
    if (!r.ok) setMsg(r.data.message ?? 'No se pudo votar.'); else refresh();
  }

  if (!snap || me === undefined) return <main className="s" aria-busy="true"><div className="skel" style={{ height: 24, width: '60%' }} />{error && <p className="err">{error}</p>}</main>;
  const { game, round } = snap;
  const mine = me ? snap.players.find((p) => p.id === me) : undefined;

  if (!mine) {
    return (
      <main className="s"><h1 className="h1">Únete a la sala</h1>
        <form className="col" onSubmit={join}>
          <label className="col" style={{ gap: 6 }}><b>Código</b><input className="inp" value={code} readOnly aria-label="Código de sala" /></label>
          <label className="col" style={{ gap: 6 }}><b>Tu nombre</b><input className="inp" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required autoComplete="nickname" /></label>
          <fieldset className="col" style={{ border: 0, padding: 0, margin: 0 }}><legend><b>Color</b></legend>
            <div className="row">{COLORS.map((c) => <button type="button" key={c} aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} style={{ width: 36, height: 36, borderRadius: 99, background: c, border: color === c ? '4px solid #1B2440' : '2px solid #1B2440' }} />)}</div></fieldset>
          {msg && <p className="err" role="alert">{msg}</p>}
          <button className="btn" disabled={busy || !name.trim()}>{busy ? 'Entrando…' : 'Entrar'}</button>
          <p className="mut" style={{ fontSize: 12 }}>Las fotos de tus dibujos se guardan en el historial de la partida.</p>
        </form></main>
    );
  }

  const submitted = round?.submitted.includes(mine.id); const voted = round?.voted.includes(mine.id);
  return (
    <main className="s">
      <div className="bar"><span>{mine.name} · {mine.score} pts</span><span>Sala {game.room_code}{round ? ` · Ronda ${round.number}/${game.rounds_total}` : ''}</span></div>
      {error && <p className="err">{error}</p>}{msg && <p className="err" role="alert">{msg}</p>}
      {game.status === 'lobby' && <div className="fade col"><h1 className="h1">¡Estás dentro!</h1><p className="mut">Mira la tele. El Game Master empezará enseguida.</p><Mascot pose="esperando" size={120} decorative /></div>}
      {game.status === 'finished' && <div className="fade col"><h1 className="h1">Fin de partida</h1><p>Has hecho {mine.score} puntos.</p><Mascot pose="gano" size={120} decorative /></div>}
      {round && game.status === 'active' && round.phase === 'idea' && <div className="fade col"><p className="mut">Prepárate…</p><div className="idea">{round.idea.emoji} {round.idea.title}</div></div>}
      {round && game.status === 'active' && (round.phase === 'drawing' || round.phase === 'upload') && (
        <div className="fade col grow">
          <div className="row" style={{ justifyContent: 'space-between' }}><span className="chip">{round.phase === 'drawing' ? 'A dibujar' : 'Sube la foto'}</span><Timer endsAt={round.phase_ends_at} serverTime={snap.server_time} /></div>
          <div className="idea">{round.idea.emoji} {round.idea.title}</div>
          <p className="mut">{round.phase === 'drawing' ? 'Dibújala en tu papel con rotulador grueso. Cuando acabes, haz la foto.' : 'Encuadra el papel entero y busca buena luz.'}</p>
          {preview && <div className="pic img" style={{ minHeight: 220 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={preview.url} alt="Vista previa de tu dibujo" /></div>}
          {submitted && !preview && <p className="toast">Foto enviada. Puedes repetirla si ha salido mal.</p>}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="vis" id="photo" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview({ file: f, url: URL.createObjectURL(f) }); }} />
          {preview ? <><button className="btn" onClick={send} disabled={busy}>{busy ? 'Enviando…' : 'Enviar'}</button><button className="btn sec" onClick={() => { setPreview(null); fileRef.current?.click(); }}>Repetir</button></>
            : <button className="btn" onClick={() => fileRef.current?.click()}>{submitted ? 'Repetir la foto' : 'Abrir la cámara'}</button>}
        </div>)}
      {round && game.status === 'active' && round.phase === 'reveal' && <div className="fade col"><h1 className="h2">Mira la tele</h1><p className="mut">Se están revelando los dibujos.</p><Mascot pose="esperando" size={100} decorative /></div>}
      {round && game.status === 'active' && round.phase === 'vote' && (
        <div className="fade col"><h1 className="h2">Elige el mejor dibujo</h1>
          <div className="pics" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
            {round.drawings.map((d) => { const own = submitted && !snap.game.anonymous ? d.player_id === mine.id : false; return (
              <button key={d.id} className={`pic img${own ? ' dim' : ''}`} style={{ minHeight: 140, cursor: 'pointer' }} disabled={busy} onClick={() => vote(d.id)} aria-label={`Votar el dibujo ${d.order}`}>
                <em>{d.order}</em>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/api/images/${d.image_path}`} alt={`Dibujo ${d.order}`} /></button>); })}
          </div>
          <p className="mut" style={{ fontSize: 12 }}>{voted ? 'Voto registrado. Puedes cambiarlo.' : 'No puedes votar tu propio dibujo.'}</p></div>)}
      {round && game.status === 'active' && round.phase === 'result' && <div className="fade col"><h1 className="h1">Resultado</h1><p>Llevas {mine.score} puntos. Mira la tele.</p></div>}
    </main>
  );
}
