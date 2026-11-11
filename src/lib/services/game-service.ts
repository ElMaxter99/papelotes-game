import { rpc } from '@/lib/db/pglite';
import type { AppContext } from './context';
import type { GameAction } from '@/lib/domain/schemas';
import type { Snapshot } from '@/lib/domain/types';

export const createGame = (ctx: AppContext, host_id: string, name: string, max_players?: number) =>
  rpc<{ room_code: string }>(ctx.db, 'pa_create_game', { host_id, name, max_players });

export const getSnapshot = (ctx: AppContext, room_code: string, view: 'public' | 'host' = 'public', host_id?: string) =>
  rpc<Snapshot>(ctx.db, 'pa_get_state', { room_code, view, host_id });

/** Acción del anfitrión → función SQL. Aquí no se decide ninguna regla. */
export function runAction(ctx: AppContext, room_code: string, host_id: string, a: GameAction) {
  const base = { room_code, host_id };
  switch (a.type) {
    case 'configure': { const { type: _t, ...rest } = a; return rpc(ctx.db, 'pa_configure_game', { ...base, ...rest }); }
    case 'start_round': return rpc(ctx.db, 'pa_start_round', base);
    case 'advance_phase': return rpc(ctx.db, 'pa_advance_phase', base);
    case 'finish': return rpc(ctx.db, 'pa_game_status', { ...base, status: 'finished' });
  }
}
