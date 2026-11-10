# Siguientes pasos: desplegar y configurar Papelotes

Guía para cuando quieras poner Papelotes en Internet. **No se ha desplegado nada** y no se despliega sin tu permiso.

## Dónde estamos (honesto)
- Hoy la app **solo funciona en modo de desarrollo** (PGlite + archivos en disco). Ese modo está bloqueado a propósito en Vercel.
- Para desplegar en Vercel **falta programar** la conexión a Supabase (base de datos, acceso por correo y almacenamiento de fotos). Eso va en las siguientes PR (ver [`PENDIENTE.md`](PENDIENTE.md)).
- Esta guía es el plan y la lista de lo que tendrás que configurar. Las variables marcadas «aún no las lee el código» son **nombres propuestos**; se confirmarán al implementar esa parte.

## 1. Servicios (todos con plan gratuito y sin tarjeta)
| Servicio | Para qué | Notas |
|---|---|---|
| GitHub | Código | Ya existe `ElMaxter99/papelotes-game`. |
| Vercel (plan Hobby) | Alojar la app | Importa el repo; el cron del plan gratuito es diario. |
| Supabase (plan gratuito) | Postgres, acceso por correo, almacenamiento de fotos | Crea un proyecto **nuevo** o comparte el de otro juego (en ese caso hay que prefijar tablas; ver `partykit-casero/docs/INFRA-Y-DESPLIEGUE.md`). |

El almacenamiento gratuito de Supabase es de 1 GB: con fotos de unos 300 KB, una partida de 10 jugadores y 10 rondas pesa unos 30 MB. Por eso están previstos compresión, cuota por partida y borrado automático.

## 2. Pasos, en orden
1. **Crear el proyecto de Supabase.** Anota la URL del proyecto y las claves (están en *Project Settings → API*). No las pegues en el chat ni en el repo.
2. **Aplicar las migraciones** de `supabase/migrations/` en orden, **incluidas las `_security_`** (en el editor SQL de Supabase o con la CLI):
   1. `20261110000000_core.sql`
   2. `20261110000100_security_core.sql`
   3. `20261110000200_papelotes.sql`
   4. `20261110000300_security_papelotes.sql`
3. **Crear el bucket de fotos** en Supabase Storage (privado) para los dibujos. *(Aún no lo usa el código.)*
4. **Configurar el acceso por correo** en Supabase Auth (*Authentication → Providers → Email*, enlace mágico) y añadir la URL de Vercel a las *Redirect URLs*. *(Aún no lo usa el código.)*
5. **Importar el repo en Vercel**, framework Next.js, sin cambiar los comandos por defecto (`npm run build`).
6. **Añadir las variables de entorno** (tabla siguiente) en *Vercel → Settings → Environment Variables*, entorno Production.
7. **Desplegar** y comprobar `/api/health` *(aún no existe)*, crear una partida y jugar con dos móviles.
8. Revisar las páginas legales y de cookies antes de compartir el enlace (aún no existen; ver `PENDIENTE.md`).

## 3. Variables de entorno
| Variable | Obligatoria | Estado | Qué hace |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí, en producción | Aún no la lee el código | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí, en producción | Aún no la lee el código | Clave pública para el acceso por correo |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí, en producción | Aún no la lee el código | Clave de servidor para llamar a las funciones `pa_*`. **Secreta**: solo en Vercel, nunca en el cliente ni en el repo |
| `ALLOWED_HOST_EMAILS` | Recomendada | Aún no la lee el código | Correos que pueden ser Game Master (lista separada por comas) |
| `CRON_SECRET` | Si usas el cron | Aún no la lee el código | Protege las rutas de limpieza (borrado de fotos antiguas) |
| `PHOTO_RETENTION_DAYS` | No | Aún no la lee el código | Días que se conservan las fotos (propuesta: 90) |
| `ALLOW_DEMO_MODE` | No (solo local) | **Ya se lee** | Permite el modo de desarrollo en un build local de producción. **Nunca se pone en Vercel**: allí está bloqueado |
| `DEMO_DATA_DIR` | No (solo local) | **Ya se lee** | Carpeta de datos del modo de desarrollo |

## 4. Opciones de configuración de una partida
Se eligen al crear la partida (hoy, en `/new-game`):

| Opción | Valores | Por defecto |
|---|---|---|
| Rondas | 1 a 30 (nunca más que ideas) | 8 |
| Tiempo para dibujar | 30 a 300 s | 90 s |
| Tiempo de subida de foto | 10 a 120 s | 20 s |
| Dibujos anónimos hasta el resultado | sí / no | sí |
| Jugadores máximos | 2 a 10 | 10 |

## 5. Qué tienes que decidir tú
1. Si usas un proyecto de Supabase nuevo para Papelotes o compartes uno existente.
2. Retención de las fotos (por defecto 90 días) y si los jugadores pueden pedir su borrado.
3. Cuándo autorizas el primer despliegue.

## 6. Qué no está verificado
Nada de esto se ha probado contra Supabase ni Vercel reales. La cámara tampoco se ha probado en móviles iOS y Android reales.
