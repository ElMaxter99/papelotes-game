'use client';
import { useEffect, useState } from 'react';

export function Timer({ endsAt, serverTime }: { endsAt: string | null; serverTime: string }) {
  const [offset] = useState(() => new Date(serverTime).getTime() - Date.now());
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => { const t = setInterval(() => setNow(Date.now() + offset), 250); return () => clearInterval(t); }, [offset]);
  if (!endsAt) return null;
  const s = Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
  return <span className="timer" role="timer" aria-live="off">{String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</span>;
}
