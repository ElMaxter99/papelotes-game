import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { assertSameOrigin, handle, ip, limit, playerCookie, roomKey, sha } from '@/lib/api';
import { fail } from '@/lib/domain/errors';
import { getContext } from '@/lib/services/context';
import { submitDrawing } from '@/lib/services/play-service';

export const POST = handle(async (req: Request, { params }: { params: Promise<{ code: string }> }) => {
  assertSameOrigin(req); limit(`draw:${ip(req)}`, 12, 60_000);
  const code = roomKey((await params).code);
  const token = (await cookies()).get(playerCookie(code))?.value; if (!token) throw fail('player_not_found');
  const form = await req.formData(); const file = form.get('photo');
  if (!(file instanceof File)) throw fail('invalid_input');
  return NextResponse.json(await submitDrawing(await getContext(), code, sha(token), file));
});
