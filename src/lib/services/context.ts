import type { PGlite } from '@electric-sql/pglite';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createPglite } from '@/lib/db/pglite';
import { demoDataDir, getRuntimeMode } from '@/lib/config/env';
import { fail } from '@/lib/domain/errors';

export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
}

export interface AppContext { db: PGlite; storage: Storage }

function diskStorage(root: string): Storage {
  const safe = (key: string) => path.join(root, key.replace(/[^A-Za-z0-9_./-]/g, '_').replace(/\.\.+/g, '_'));
  return {
    async put(key, data, contentType) {
      const file = safe(key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, data); await writeFile(file + '.type', contentType);
    },
    async get(key) {
      try { const file = safe(key); return { data: await readFile(file), contentType: (await readFile(file + '.type', 'utf8')) || 'image/jpeg' }; }
      catch { return null; }
    },
  };
}

const g = globalThis as unknown as { __pa_ctx?: Promise<AppContext> };

export function getContext(): Promise<AppContext> {
  if (getRuntimeMode() !== 'demo') throw fail('unconfigured');
  g.__pa_ctx ??= (async () => {
    const dir = demoDataDir();
    await mkdir(dir, { recursive: true });
    return { db: await createPglite(path.join(dir, 'db')), storage: diskStorage(path.join(dir, 'images')) };
  })();
  return g.__pa_ctx;
}
