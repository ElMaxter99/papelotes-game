import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash, randomUUID } from 'node:crypto';
import { DomainError, fail, toDomainError } from '@/lib/domain/errors';
import { ROOM_RE } from '@/lib/domain/schemas';

export function handle<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A): Promise<Response> => {
    try { return await fn(...a); }
    catch (e) {
      const err = toDomainError(e);
      if (err.status >= 500) console.error('[api]', e);
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
  };
}

/** Defensa CSRF: las peticiones que cambian algo deben venir del mismo origen. */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return; // peticiones sin Origin (curl, tests): las protege la cookie y el token
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host || new URL(origin).host !== host) throw fail('bad_origin');
}

const buckets = new Map<string, { n: number; reset: number }>();
/** Límite de tasa en memoria (suficiente en desarrollo; en producción se sustituirá por uno compartido). */
export function limit(key: string, max: number, windowMs = 10_000) {
  const now = Date.now(); const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return; }
  if (++b.n > max) throw new DomainError('rate_limited', 429, 'Demasiadas peticiones. Espera un momento.');
}

export const roomKey = (code: string) => { if (!ROOM_RE.test(code)) throw fail('game_not_found'); return code.toUpperCase(); };
export const ip = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
export const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export async function readJson<T>(req: Request, parse: (v: unknown) => T): Promise<T> {
  let raw: unknown; try { raw = await req.json(); } catch { throw fail('invalid_input'); }
  try { return parse(raw); } catch { throw fail('invalid_input'); }
}

export const HOST_COOKIE = 'pa_host';
export async function hostId(): Promise<string | null> { return (await cookies()).get(HOST_COOKIE)?.value ?? null; }
export const playerCookie = (code: string) => `pa_p_${code}`;
export const newToken = () => randomUUID() + randomUUID();
