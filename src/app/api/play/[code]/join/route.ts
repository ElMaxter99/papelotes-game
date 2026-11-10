import { NextResponse } from 'next/server';
import { assertSameOrigin, handle, ip, limit, newToken, playerCookie, readJson, roomKey, sha } from '@/lib/api';
import { joinSchema } from '@/lib/domain/schemas';
import { getContext } from '@/lib/services/context';
import { joinPlayer } from '@/lib/services/play-service';

export const POST = handle(async (req: Request, { params }: { params: Promise<{ code: string }> }) => {
  assertSameOrigin(req); limit(`join:${ip(req)}`, 15, 60_000);
  const code = roomKey((await params).code);
  const body = await readJson(req, (v) => joinSchema.parse(v));
  const token = newToken();
  const r = await joinPlayer(await getContext(), code, body.name, body.color, sha(token));
  const res = NextResponse.json({ player_id: r.player_id }, { status: 201 });
  res.cookies.set(playerCookie(code), token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 });
  return res;
});
