import { NextResponse } from 'next/server';
import { assertSameOrigin, handle, hostId, ip, limit, readJson } from '@/lib/api';
import { createGameSchema } from '@/lib/domain/schemas';
import { fail } from '@/lib/domain/errors';
import { getContext } from '@/lib/services/context';
import { createGame } from '@/lib/services/game-service';

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req); limit(`create:${ip(req)}`, 10, 60_000);
  const host = await hostId(); if (!host) throw fail('not_host');
  const body = await readJson(req, (v) => createGameSchema.parse(v));
  const r = await createGame(await getContext(), host, body.name, body.max_players);
  return NextResponse.json(r, { status: 201 });
});
