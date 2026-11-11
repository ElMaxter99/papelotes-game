import { NextResponse } from 'next/server';
import { handle, hostId, roomKey } from '@/lib/api';
import { getContext } from '@/lib/services/context';
import { getSnapshot } from '@/lib/services/game-service';

export const GET = handle(async (_req: Request, { params }: { params: Promise<{ code: string }> }) => {
  const code = roomKey((await params).code);
  const snap = await getSnapshot(await getContext(), code, 'host', (await hostId()) ?? undefined);
  return NextResponse.json(snap);
});
