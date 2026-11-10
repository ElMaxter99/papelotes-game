/** Modo de ejecución. De momento solo existe el modo de desarrollo (PGlite + disco); Supabase queda pendiente (docs/PENDIENTE.md). */
export type RuntimeMode = 'demo' | 'unconfigured';

export function getRuntimeMode(): RuntimeMode {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return 'unconfigured'; // nunca modo de desarrollo en Vercel
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_MODE !== 'true') return 'unconfigured';
  return 'demo';
}

export const demoDataDir = () => process.env.DEMO_DATA_DIR || '.demo-data';
