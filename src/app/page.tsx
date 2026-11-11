import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Mascot } from '@/components/brand/Mascot';

export default function Home() {
  return (
    <main className="page">
      <header className="top" style={{ padding: '16px 0' }}><Logo /><span className="grow" /><Link className="btn sec sm" href="/new-game">Entrar</Link><Link className="btn sm" href="/new-game">Crear partida</Link></header>
      <section className="row" style={{ padding: '40px 0', gap: 40, alignItems: 'center' }}>
        <div className="col grow" style={{ gap: 16, minWidth: 280 }}>
          <h1 className="h1" style={{ fontSize: 'clamp(34px,6vw,56px)' }}>Dibuja en papel.<br />La tele lo revela.</h1>
          <p className="mut" style={{ fontSize: 16, maxWidth: 480 }}>Todos dibujan la misma idea en su papel, le hacen una foto con el móvil y la pantalla los muestra para votar. Cada partida queda guardada.</p>
          <div className="row"><Link className="btn" href="/new-game">Crear una partida</Link><Link className="btn sec" href="/join">Tengo un código</Link></div>
        </div>
        <div className="col" style={{ width: 300, alignItems: 'center' }}><Mascot pose="hola" size={240} /><div className="idea" style={{ fontSize: 28 }}>Una casa</div></div>
      </section>
      <section className="row" style={{ gap: 12 }}>
        {[['1 · Mira la idea', 'En la tele y en tu móvil'], ['2 · Dibuja en papel', 'Entre 60 y 120 segundos'], ['3 · Haz la foto', 'Desde tu móvil'], ['4 · Vota', 'Anónimo hasta el final']].map(([t, d]) => <div className="card col grow" key={t}><b>{t}</b><span className="mut">{d}</span></div>)}
      </section>
      <footer className="bar" style={{ padding: '32px 0' }}><span>Hecho en casa para jugar en casa</span></footer>
    </main>
  );
}
