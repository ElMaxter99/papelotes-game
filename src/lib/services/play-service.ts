import { rpc } from '@/lib/db/pglite';
import type { AppContext } from './context';
import { fail } from '@/lib/domain/errors';

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export const joinPlayer = (ctx: AppContext, room_code: string, name: string, color: string | undefined, token_hash: string) =>
  rpc<{ player_id: string }>(ctx.db, 'pa_join_new_player', { room_code, name, color, token_hash });
export const identify = (ctx: AppContext, room_code: string, token_hash: string) =>
  rpc<{ player_id: string | null }>(ctx.db, 'pa_identify_player', { room_code, token_hash });
export const ping = (ctx: AppContext, room_code: string, token_hash: string) =>
  rpc(ctx.db, 'pa_player_ping', { room_code, token_hash });
export const vote = (ctx: AppContext, room_code: string, token_hash: string, drawing_id: string) =>
  rpc(ctx.db, 'pa_vote', { room_code, token_hash, drawing_id });

/** Guarda la foto (comprobando tipo y tamaño) y la registra como entrega. La normalización a WebP llega en la siguiente PR. */
export async function submitDrawing(ctx: AppContext, room_code: string, token_hash: string, file: File) {
  const ext = TYPES[file.type];
  if (!ext) throw fail('image_invalid');
  if (file.size > MAX_BYTES) throw fail('image_too_large');
  const data = Buffer.from(await file.arrayBuffer());
  const ok = (ext === 'jpg' && data[0] === 0xff && data[1] === 0xd8) || (ext === 'png' && data[0] === 0x89 && data[1] === 0x50) || (ext === 'webp' && data.subarray(8, 12).toString() === 'WEBP');
  if (!ok) throw fail('image_invalid');
  const key = `${room_code}/${crypto.randomUUID()}.${ext}`;
  await ctx.storage.put(key, data, file.type);
  return rpc(ctx.db, 'pa_submit_drawing', { room_code, token_hash, image_path: key });
}
