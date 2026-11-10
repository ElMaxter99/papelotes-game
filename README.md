# Papelotes

Juego de fiesta para jugar en casa: la **TV** muestra una idea, todos **dibujan en papel**, hacen una **foto con el móvil**, la TV revela los dibujos y se **vota** el mejor. Cada partida guarda sus dibujos. Parte de la arquitectura de PartyKit Casero (TV + móviles + Game Master).

> Estado: **esqueleto jugable en modo de desarrollo**. No hay despliegue ni Supabase conectado. Ver [`docs/PENDIENTE.md`](docs/PENDIENTE.md).

## Probarlo en local
```bash
npm install
npm run dev          # modo de desarrollo: PGlite + datos en .demo-data
```
1. Abre `/new-game` para crear una sala como Game Master (sin cuenta, solo en desarrollo).
2. Abre la TV en `/game/CÓDIGO/screen` y, en otros dispositivos, `/join` o `/game/CÓDIGO/play`.
3. Con al menos 2 jugadores, empieza desde el panel `/game/CÓDIGO/host`.

## Comandos
```bash
npm run lint && npm run typecheck && npm test
npm run build
```

## Qué incluye hoy
Portada, unirse con código, nueva partida, TV por fases, móvil del jugador (cámara, vista previa, voto), panel del Game Master, reglas en SQL (`pa_*`) con tests, y el sistema de diseño del lienzo aprobado.

## Variables de entorno
`ALLOW_DEMO_MODE=true` permite el modo de desarrollo en un build local de producción; `DEMO_DATA_DIR` cambia la carpeta de datos. En Vercel el modo de desarrollo nunca funciona. Sin capturas de pantalla aún: se añadirán cuando haya e2e.

## Documentación
[`docs/README.md`](docs/README.md) · [`docs/REGLAS-DE-JUEGO.md`](docs/REGLAS-DE-JUEGO.md) · [`docs/PENDIENTE.md`](docs/PENDIENTE.md)
