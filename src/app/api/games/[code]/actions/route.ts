import { NextResponse } from 'next/server';
import { assertSameOrigin, handle, hostId, ip, limit, readJson, roomKey } from '@/lib/api';
import { actionSchema } from '@/lib/domain/schemas';
import { fail } from '@/lib/domain/errors';
import { getContext } from '@/lib/services/context';
import { runAction } from '@/lib/services/game-service';

export const POST = handle(async (req: Request, { params }: { params: Promise<{ code: string }> }) => {
  assertSameOrigin(req); limit(`act:${ip(req)}`, 60);
  const code = roomKey((await params).code);
  const host = await hostId(); if (!host) throw fail('not_host');
  const action = await readJson(req, (v) => actionSchema.parse(v));
  return NextResponse.json(await runAction(await getContext(), code, host, action));
});
