# Pendiente del propietario

Sin secretos aquí.

## Migraciones por aplicar
Ninguna todavía: no hay proyecto de Supabase conectado. Cuando se cree, aplicar en orden `supabase/migrations/*.sql` (incluidas las `_security_`).

## Variables en Vercel
Aún no hay despliegue. No se despliega sin permiso del propietario.

## No verificado
- Todo funciona solo en modo de desarrollo (PGlite + disco). **Nada se ha probado contra Supabase real ni en Vercel.**
- La cámara con `capture="environment"` no se ha probado en móviles iOS/Android reales.
- No hay tests e2e de navegador todavía; se comprobó a mano el flujo por API y la TV con una captura.

## Siguiente (PR 2 en adelante, según el lienzo aprobado)
1. Acceso del Game Master por correo (Supabase Auth) y listados propios.
2. Listas de ideas (sistema, admin y propias), ideas con foto, importar/exportar JSON.
3. Normalizar la foto en el servidor (WebP, tamaño fijo) con `sharp`; reducción en el cliente.
4. Avance automático de fases por tiempo; presencia y expulsión; reintento de subida sin red.
5. Historial por partida (ZIP, collage) y borrado de fotos; panel de admin y versiones móviles.
6. Modo «adivina el dibujo», temas y páginas legales.
