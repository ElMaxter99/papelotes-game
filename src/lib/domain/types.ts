export type Phase = 'idea' | 'drawing' | 'upload' | 'reveal' | 'vote' | 'result';
export interface PlayerView { id: string; name: string; color: string; score: number; claimed: boolean; joined: boolean; retired: boolean; online: boolean }
export interface DrawingView { id: string; order: number; image_path: string; player_id: string | null; votes: number | null; points: number | null }
export interface RoundView {
  number: number; phase: Phase; phase_ends_at: string | null;
  idea: { title: string; emoji: string | null; image_url: string | null };
  drawings: DrawingView[]; submitted: string[]; voted: string[];
}
export interface Snapshot {
  version: number; server_time: string;
  game: { id: string; room_code: string; name: string; status: 'lobby' | 'active' | 'paused' | 'finished'; max_players: number;
    rounds_total: number; draw_seconds: number; upload_seconds: number; anonymous: boolean; current_round: number };
  players: PlayerView[];
  round: RoundView | null;
}
