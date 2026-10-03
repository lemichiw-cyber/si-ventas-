/**
 * Respaldo de una base Supabase via REST (service_role key).
 * Funciona sin psql ni driver pg: solo fetch.
 *
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   node scripts/backup-rest.mjs
 *
 * Escribe backend/backups/rest-<timestamp>.json con cada tabla y sus filas,
 * mas el esquema (columnas) que reporta PostgREST.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, '..', 'backups');

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLES = (process.env.TABLES || '').split(',').map((t) => t.trim()).filter(Boolean);

if (!URL_BASE || !KEY) {
  console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const rest = `${URL_BASE.replace(/\/$/, '')}/rest/v1`;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function get(path) {
  const r = await fetch(`${rest}${path}`, { headers: H });
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status} ${await r.text()}`);
  return r;
}

async function countOf(t) {
  const r = await fetch(`${rest}/${t}?select=*`, {
    headers: { ...H, Prefer: 'count=exact', Range: '0-0' },
  });
  const cr = r.headers.get('content-range') || '';
  const total = Number((cr.split('/')[1] || '0').trim());
  return Number.isFinite(total) ? total : 0;
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await mkdir(BACKUP_DIR, { recursive: true });

  let tables = TABLES;
  if (!tables.length) {
    const spec = await (await get('/')).json();
    tables = Object.keys(spec.paths || {})
      .map((p) => p.split('/')[1])
      .filter((t) => t && !['rpc'].includes(t));
    tables = [...new Set(tables)].sort();
  }

  const dump = { generado: new Date().toISOString(), project: URL_BASE, tablas: {} };
  let totalRows = 0;

  for (const t of tables) {
    let filas = [];
    let count = 0;
    try {
      count = await countOf(t);
      if (count > 0) {
        // hasta 1000 filas por request
        for (let from = 0; from < count; from += 1000) {
          const to = from + 999;
          filas = filas.concat(
            await (
              await get(`/${t}?select=*&order=id.asc&offset=${from}&limit=1000&Range=${from}-${to}`)
            ).json()
          );
        }
      }
    } catch (e) {
      console.log(`  ${t}: ERROR ${e.message}`);
      dump.tablas[t] = { error: e.message, filas: [] };
      continue;
    }
    dump.tablas[t] = { count: filas.length, filas };
    totalRows += filas.length;
    console.log(`  ${t}: ${filas.length} filas`);
  }

  const outFile = join(BACKUP_DIR, `rest-${stamp}.json`);
  await writeFile(outFile, JSON.stringify(dump, null, 2), 'utf8');
  console.log(`\nRespaldo: ${outFile}`);
  console.log(`Tablas: ${tables.length}  Filas: ${totalRows}`);
}

main().catch((e) => {
  console.error('FALLO:', e.message);
  process.exit(1);
});
