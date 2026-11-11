import { handle } from '@/lib/api';
import { fail } from '@/lib/domain/errors';
import { getContext } from '@/lib/services/context';

export const GET = handle(async (_req: Request, { params }: { params: Promise<{ key: string[] }> }) => {
  const key = (await params).key.join('/');
  const img = await (await getContext()).storage.get(key);
  if (!img) throw fail('drawing_not_found');
  return new Response(new Uint8Array(img.data), { headers: { 'Content-Type': img.contentType, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
});
