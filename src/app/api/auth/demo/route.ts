import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { assertSameOrigin, handle, HOST_COOKIE, hostId } from '@/lib/api';
import { fail } from '@/lib/domain/errors';
import { getRuntimeMode } from '@/lib/config/env';

/** Solo desarrollo: entra como Game Master sin cuenta. No existe en producción. */
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  if (getRuntimeMode() !== 'demo') throw fail('unconfigured');
  const id = (await hostId()) ?? randomUUID();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(HOST_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
});
