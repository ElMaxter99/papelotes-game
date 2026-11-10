import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { assertSameOrigin, handle, ip, limit, playerCookie, readJson, roomKey, sha } from '@/lib/api';
import { fail } from '@/lib/domain/errors';
import { voteSchema } from '@/lib/domain/schemas';
import { getContext } from '@/lib/services/context';
import { vote } from '@/lib/services/play-service';

export const POST = handle(async (req: Request, { params }: { params: Promise<{ code: string }> }) => {
  assertSameOrigin(req); limit(`vote:${ip(req)}`, 30);
  const code = roomKey((await params).code);
  const token = (await cookies()).get(playerCookie(code))?.value; if (!token) throw fail('player_not_found');
  const body = await readJson(req, (v) => voteSchema.parse(v));
  return NextResponse.json(await vote(await getContext(), code, sha(token), body.drawing_id));
});
