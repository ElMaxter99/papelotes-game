'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Join() {
  const [code, setCode] = useState(''); const router = useRouter();
  return (
    <main className="page" style={{ maxWidth: 420 }}>
      <h1 className="h1" style={{ margin: '40px 0 16px' }}>¿Cuál es tu sala?</h1>
      <form className="col" onSubmit={(e) => { e.preventDefault(); router.push(`/game/${code.trim().toUpperCase()}/play`); }}>
        <label className="col" style={{ gap: 6 }}><b>Código</b><input className="inp" value={code} onChange={(e) => setCode(e.target.value)} maxLength={12} autoCapitalize="characters" required style={{ letterSpacing: '.3em', textTransform: 'uppercase' }} /></label>
        <button className="btn" disabled={code.trim().length < 4}>Continuar</button>
        <p className="mut" style={{ fontSize: 12 }}>También puedes escanear el QR de la tele.</p>
      </form>
    </main>
  );
}
