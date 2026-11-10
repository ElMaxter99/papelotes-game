'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Snapshot } from '@/lib/domain/types';

/** Sondea la instantánea; solo aplica una versión mayor que la actual (los avisos atrasados no pisan datos nuevos). */
export function useGame(code: string, host = false, intervalMs = 1500) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ver = useRef(-1);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch(host ? `/api/games/${code}` : `/api/public/games/${code}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) { setError(j.message ?? 'Error'); return; }
      setError(null);
      if (j.version > ver.current) { ver.current = j.version; setSnap(j); }
    } catch { setError('Sin conexión. Reintentando…'); }
  }, [code, host]);
  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const t = setInterval(refresh, intervalMs);
    const vis = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearTimeout(first); clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [refresh, intervalMs]);
  return { snap, error, refresh };
}

export async function post(url: string, body?: unknown): Promise<{ ok: boolean; data: any }> {
  const r = await fetch(url, { method: 'POST', headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' }, body: body instanceof FormData ? body : JSON.stringify(body ?? {}) });
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
}
