import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { assertSameOrigin, handle, playerCookie, roomKey, sha, limit, ip } from '@/lib/api';
import { getContext } from '@/lib/services/context';
import { ping } from '@/lib/services/play-service';

export const POST = handle(async (req: Request, { params }: { params: Promise<{ code: string }> }) => {
  assertSameOrigin(req); limit(`ping:${ip(req)}`, 30);
  const code = roomKey((await params).code);
  const token = (await cookies()).get(playerCookie(code))?.value;
  if (token) await ping(await getContext(), code, sha(token));
  return NextResponse.json({ ok: true });
});
