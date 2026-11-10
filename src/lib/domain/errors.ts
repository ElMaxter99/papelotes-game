export class DomainError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}

const TABLE: Record<string, [number, string]> = {
  game_not_found: [404, 'No encuentro esa sala. Revisa el código que se ve en la tele.'],
  not_host: [403, 'Solo el Game Master puede hacer esto.'],
  invalid_input: [400, 'Faltan datos o no son válidos.'],
  invalid_state: [409, 'La partida no está en el estado adecuado para esto.'],
  join_closed: [409, 'La partida ya ha empezado y no admite más jugadores.'],
  too_many_players: [409, 'La sala está llena.'],
  duplicate_name: [409, 'Ese nombre ya está en uso. Elige otro.'],
  player_not_found: [401, 'No te reconozco en esta sala. Vuelve a unirte.'],
  player_retired: [403, 'Has salido de la partida.'],
  no_ideas: [400, 'Añade al menos una idea para jugar.'],
  not_enough_players: [409, 'Hacen falta al menos 2 jugadores.'],
  round_in_progress: [409, 'Ya hay una ronda en curso.'],
  no_more_rounds: [409, 'Se acabaron las rondas.'],
  no_open_round: [409, 'No hay ninguna ronda abierta.'],
  phase_closed: [409, 'Ya no se puede hacer esto en esta fase.'],
  drawing_not_found: [404, 'Ese dibujo no existe.'],
  own_drawing: [409, 'No puedes votar tu propio dibujo.'],
  idempotency_conflict: [409, 'Petición repetida con otra acción.'],
  rate_limited: [429, 'Demasiadas peticiones. Espera un momento.'],
  bad_origin: [403, 'Origen no permitido.'],
  image_too_large: [413, 'La foto pesa demasiado. Haz otra o reduce su tamaño.'],
  image_invalid: [415, 'Ese archivo no es una imagen válida.'],
  unconfigured: [503, 'La aplicación aún no está configurada.'],
};

export function toDomainError(e: unknown): DomainError {
  if (e instanceof DomainError) return e;
  const code = (e as { code?: string })?.code;
  if (code && TABLE[code]) return new DomainError(code, TABLE[code][0], TABLE[code][1]);
  return new DomainError('internal', 500, 'Algo ha fallado. Inténtalo de nuevo.');
}
export const fail = (code: string) => new DomainError(code, TABLE[code]?.[0] ?? 400, TABLE[code]?.[1] ?? code);
