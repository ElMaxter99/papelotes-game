import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { handle, playerCookie, roomKey, sha } from '@/lib/api';
import { getContext } from '@/lib/services/context';
import { identify } from '@/lib/services/play-service';

export const GET = handle(async (_req: Request, { params }: { params: Promise<{ code: string }> }) => {
  const code = roomKey((await params).code);
  const token = (await cookies()).get(playerCookie(code))?.value;
  if (!token) return NextResponse.json({ player_id: null });
  return NextResponse.json(await identify(await getContext(), code, sha(token)));
});
