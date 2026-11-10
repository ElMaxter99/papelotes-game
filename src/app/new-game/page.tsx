'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { post } from '@/components/use-game';

const SAMPLE = ['Una casa', 'Un perro', 'Un cohete', 'Un pulpo', 'Una bicicleta', 'Un castillo', 'Un helado', 'Un robot'].join('\n');

export default function NewGame() {
  const router = useRouter();
  const [name, setName] = useState('Sábado en casa'); const [ideas, setIdeas] = useState(SAMPLE);
  const [rounds, setRounds] = useState(8); const [secs, setSecs] = useState(90);
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const auth = await post('/api/auth/demo'); if (!auth.ok) { setBusy(false); return setMsg(auth.data.message ?? 'No se pudo entrar.'); }
    const g = await post('/api/games', { name }); if (!g.ok) { setBusy(false); return setMsg(g.data.message ?? 'No se pudo crear la partida.'); }
    const list = ideas.split('\n').map((t) => t.trim()).filter(Boolean).map((title) => ({ title }));
    const c = await post(`/api/games/${g.data.room_code}/actions`, { type: 'configure', ideas: list, rounds_total: rounds, draw_seconds: secs });
    setBusy(false); if (!c.ok) return setMsg(c.data.message ?? 'No se pudo configurar.');
    router.push(`/game/${g.data.room_code}/host`);
  }
  return (
    <main className="page" style={{ maxWidth: 560 }}>
      <h1 className="h1" style={{ margin: '32px 0 8px' }}>Nueva partida</h1>
      <p className="mut" style={{ marginBottom: 16 }}>Modo de desarrollo: entras como Game Master sin cuenta. El acceso por correo llegará en otra PR.</p>
      <form className="col" onSubmit={create}>
        <label className="col" style={{ gap: 6 }}><b>Nombre de la partida</b><input className="inp" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></label>
        <label className="col" style={{ gap: 6 }}><b>Ideas (una por línea)</b><textarea className="inp" rows={8} value={ideas} onChange={(e) => setIdeas(e.target.value)} /></label>
        <div className="row"><label className="col grow" style={{ gap: 6 }}><b>Rondas</b><input className="inp" type="number" min={1} max={30} value={rounds} onChange={(e) => setRounds(+e.target.value)} /></label>
          <label className="col grow" style={{ gap: 6 }}><b>Segundos para dibujar</b><input className="inp" type="number" min={30} max={300} value={secs} onChange={(e) => setSecs(+e.target.value)} /></label></div>
        {msg && <p className="err" role="alert">{msg}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Creando…' : 'Crear sala'}</button>
      </form>
    </main>
  );
}
