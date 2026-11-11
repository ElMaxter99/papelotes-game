import { NextResponse } from 'next/server';
import { handle, ip, limit, roomKey } from '@/lib/api';
import { getContext } from '@/lib/services/context';
import { getSnapshot } from '@/lib/services/game-service';

export const GET = handle(async (req: Request, { params }: { params: Promise<{ code: string }> }) => {
  limit(`pub:${ip(req)}`, 120);
  const code = roomKey((await params).code);
  return NextResponse.json(await getSnapshot(await getContext(), code), { headers: { 'Cache-Control': 'no-store' } });
});
