import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Migraciones portables, en orden. Las `_security_` son solo de Supabase y no se ejecutan aquí. */
export function listMigrations(dir = path.join(process.cwd(), 'supabase', 'migrations')): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.includes('_security'))
    .sort()
    .map((f) => path.join(dir, f));
}

export async function createPglite(dataDir?: string): Promise<PGlite> {
  const db = new PGlite(dataDir);
  await db.waitReady;
  await db.exec('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  for (const file of listMigrations()) {
    const name = path.basename(file);
    const done = await db.query('select 1 from schema_migrations where name = $1', [name]);
    if (done.rows.length) continue;
    await db.exec(readFileSync(file, 'utf8'));
    await db.query('insert into schema_migrations (name) values ($1)', [name]);
  }
  return db;
}

/** Llama a una función `pa_*` con el parámetro jsonb. Los errores `ERR:codigo` se devuelven como Error con `.code`. */
export async function rpc<T = Record<string, unknown>>(db: PGlite, fn: string, p: Record<string, unknown>): Promise<T> {
  if (!/^pa_[a-z_]+$/.test(fn)) throw new Error('función no permitida');
  try {
    const res = await db.query<{ r: T }>(`select ${fn}($1::jsonb) as r`, [JSON.stringify(p)]);
    return res.rows[0].r;
  } catch (e) {
    const m = /ERR:([a-z_]+)/.exec((e as Error).message);
    if (m) throw Object.assign(new Error(m[1]), { code: m[1] });
    throw e;
  }
}
