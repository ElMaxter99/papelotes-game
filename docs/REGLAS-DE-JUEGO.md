# Reglas de juego

Todas viven en funciones SQL `pa_*` (`supabase/migrations/20261110000200_papelotes.sql`). Probadas en `tests/rules.test.ts` sobre PGlite.

## Bucle de una ronda
`idea` → `drawing` (90 s por defecto) → `upload` (+20 s) → `reveal` → `vote` → `result`. El Game Master avanza cada fase (`pa_advance_phase`); el avance automático por tiempo queda pendiente. Si nadie entrega foto, se salta la votación.

## Fase × pantalla
| Fase | TV | Móvil | Game Master |
|---|---|---|---|
| Sala | Código y jugadores | Formulario de unirse | Empezar (mín. 2 jugadores) |
| Idea | Idea grande | Idea | Empezar a dibujar |
| Dibujo | Cuenta atrás y quién ha entregado | Cuenta atrás, cámara | Cerrar el dibujo |
| Subida | Barra de fotos subidas | Cámara, vista previa, enviar o repetir | Cerrar y revelar |
| Revelación | Dibujos numerados, anónimos | «Mira la tele» | Abrir la votación |
| Votación | Dibujos y cuántos han votado | Elegir el mejor (no el propio) | Cerrar la votación |
| Resultado | Autores, votos y puntos | Tus puntos | Siguiente ronda o terminar |

## Secretos
Mientras la partida es anónima, la instantánea pública no incluye el autor de cada dibujo ni los votos hasta `result`. El filtrado se hace en SQL (`pa_get_state`), y un test lo comprueba.

## Puntuación
Enteros: 100 por voto recibido y +50 por entregar a tiempo (dentro del dibujo, o hasta 2 s después). Quien no entrega queda «sin foto» y suma 0. Se puntúa una sola vez al cerrar la ronda.

## Fin de partida
Cuando se agotan las rondas (`rounds_total`, máximo el número de ideas) o el Game Master termina; la TV muestra el podio.
