import { z } from 'zod';

export const ideaSchema = z.object({
  title: z.string().trim().min(1).max(80),
  emoji: z.string().max(8).optional(),
  image_url: z.string().url().max(500).optional(),
  difficulty: z.number().int().min(1).max(3).optional(),
});

export const createGameSchema = z.object({
  name: z.string().trim().min(1).max(80),
  max_players: z.number().int().min(2).max(10).optional(),
});

export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('configure'), rounds_total: z.number().int().min(1).max(30).optional(),
    draw_seconds: z.number().int().min(30).max(300).optional(), upload_seconds: z.number().int().min(10).max(120).optional(),
    anonymous: z.boolean().optional(), ideas: z.array(ideaSchema).min(1).max(200) }),
  z.object({ type: z.literal('start_round') }),
  z.object({ type: z.literal('advance_phase') }),
  z.object({ type: z.literal('finish') }),
]);
export type GameAction = z.infer<typeof actionSchema>;

export const joinSchema = z.object({ name: z.string().trim().min(1).max(40), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() });
export const voteSchema = z.object({ drawing_id: z.string().uuid() });
export const ROOM_RE = /^[A-Za-z0-9]{4,12}$/;
