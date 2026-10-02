/**
 * Respaldo completo de la base de datos antes de tocar imagen_principal.
 *
 *   node scripts/backup-db.mjs                 # usa DATABASE_URL del entorno
 *   DATABASE_URL=postgresql://... node scripts/backup-db.mjs
 *
 * Escribe un .sql autocontenido en backend/backups/ con:
 *   - CREATE TABLE de cada tabla (esquema real, con defaults e índices)
 *   - filas en formato INSERT
 *   - índices y constraints
 *
 * Es un snapshot logico. Para restaurar en otro lado:
 *   psql "$DATABASE_URL" -f backend/backups/<archivo>.sql
 */
import { Client } from 'pg';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, '..', 'backups');

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('Falta DATABASE_URL.');
  console.error('Uso: DATABASE_URL=postgresql://... node scripts/backup-db.mjs');
  process.exit(1);
}

// Sin esto pg solo acepta parametros ($1), no nombres de columna.
const client = new Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

async function main() {
  await client.connect();
  console.log('Conexion OK');

  const schema = await client.query(`
    select table_name, column_name, data_type, column_default, is_nullable
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `);
  const tables = [...new Set(schema.rows.map((r) => r.table_name))];
  if (!tables.length) {
    console.error('La base no tiene tablas en el schema public.');
    await client.end();
    process.exit(1);
  }
  console.log('Tablas:', tables.join(', '));

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await mkdir(BACKUP_DIR, { recursive: true });
  const outFile = join(BACKUP_DIR, `backup-${stamp}.sql`);

  const parts = [
    `-- Respaldo Dulce Encanto`,
    `-- Generado: ${new Date().toISOString()}`,
    `-- Tablas: ${tables.length}`,
    '',
    'BEGIN;',
    '',
  ];

  let totalRows = 0;

  for (const t of tables) {
    const cols = schema.rows.filter((r) => r.table_name === t);
    const colList = cols.map((c) => c.column_name);

    // CREATE TABLE
    parts.push(`-- ===== ${t} =====`);
    parts.push(`DROP TABLE IF EXISTS "${t}" CASCADE;`);
    parts.push(`CREATE TABLE "${t}" (`);
    parts.push(
      cols
        .map((c) => `  "${c.column_name}" ${c.data_type}${c.column_default ? ` DEFAULT ${c.column_default}` : ''}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
        .join(',\n')
    );
    parts.push(');');

    // filas
    const { rows } = await client.query(`select ${colList.map((c) => `"${c}"`).join(', ')} from "${t}"`);
    if (rows.length) {
      const values = rows
        .map((r) => `  (${colList.map((c) => q(r[c])).join(', ')})`)
        .join(',\n');
      parts.push(`INSERT INTO "${t}" (${colList.map((c) => `"${c}"`).join(', ')}) VALUES\n${values};`);
      totalRows += rows.length;
      console.log(`  ${t}: ${rows.length} filas`);
    } else {
      console.log(`  ${t}: 0 filas`);
    }
    parts.push('');
  }

  // indices
  const idx = await client.query(`select indexname, indexdef from pg_indexes where schemaname = 'public'`);
  if (idx.rows.length) {
    parts.push('-- ===== Indices =====');
    for (const r of idx.rows) parts.push(`${r.indexdef};`);
    parts.push('');
  }

  parts.push('COMMIT;', '');

  await writeFile(outFile, parts.join('\n'), 'utf8');
  console.log(`\nRespaldo escrito: ${outFile}`);
  console.log(`Total filas respaldadas: ${totalRows}`);
  console.log('Restaurar con: psql "$DATABASE_URL" -f ' + outFile);

  await client.end();
}

main().catch(async (e) => {
  console.error('FALLO:', e.message);
  try { await client.end(); } catch {}
  process.exit(1);
});
