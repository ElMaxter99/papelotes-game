# Papelotes · guía para Claude (léela primero)

<!-- Una frase: qué es el juego y por qué es divertido en grupo. -->

> Este juego sigue la arquitectura de **PartyKit Casero** (workspace privado `ElMaxter99/partykit-casero`): lee su `CLAUDE.md` y `docs/ARQUITECTURA.md` si tienes acceso. Antes de tocar nada lee `AGENTS.md` y `docs/README.md`.

## Stack
Next.js App Router · TypeScript estricto · Tailwind · Zod · Supabase (Postgres, Auth, Realtime Broadcast, Storage) · PGlite (tests y desarrollo) · Vitest · Playwright. Despliegue: Vercel. Idioma: español.

## Comandos
```bash
npm run dev                                     # sin credenciales arranca en modo de desarrollo (PGlite)
npm run lint && npm run typecheck && npm test   # comprobación rápida
npm run build && npm run scan:secrets           # antes de dar nada por terminado
```

## Regla de oro
Toda la lógica de decisión vive en funciones SQL `pa_*` (`p jsonb`, `RAISE 'ERR:codigo'`, bloqueo `FOR UPDATE`, idempotencia, `pa_touch` en cada cambio). TypeScript valida, autentica, llama a `ctx.db.rpc` y presenta. No dupliques reglas en TS.

## Añadir una función (receta)
1. Migración portable + `_security_` (nunca editar una aplicada).
2. Función grande ya existente → patrón envoltorio.
3. Acción del anfitrión: `schemas.ts` → `toRpc` → función SQL; error nuevo en `errors.ts`.
4. Tipos, UI en `components/{screen,host,play}`, ruta con `handle()`, `assertSameOrigin`, `limit()`.
5. Tests (PGlite; e2e si es de UI) y documentación.

## Reglas que no se negocian
Honestidad (no simular IA ni despliegues) · solo servicios gratuitos, sin pago automático · secretos nunca en repo/logs/chat · migraciones inmutables · cliente sin `service_role` · README y docs al día · no crear PR si no te lo piden · no desplegar sin permiso.

## Qué es
Juego de fiesta en casa: la TV muestra una idea, todos dibujan **en papel**, fotografían el dibujo con el móvil, la TV lo revela y se vota. Cada partida guarda sus dibujos. Diseño aprobado: lienzo «Papelotes Lienzo» y `design/mockups.html`.

## Mapa
```
supabase/migrations/   núcleo común + reglas del juego (pa_*) + _security_
src/lib/{config,db,domain,services}/   env, PGlite, Zod y errores, servicios (no deciden reglas)
src/app/               páginas y /api/*      src/components/{screen,play,host}/
tests/                 reglas SQL con PGlite
design/                maquetas HTML (histórico del diseño)
```
<!-- Rellenar con las carpetas reales del juego. -->
