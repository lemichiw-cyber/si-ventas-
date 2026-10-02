/**
 * Actualiza imagen_principal de los productos a URLs que existen.
 *
 *   node scripts/fix-imagenes.mjs            # solo muestra el plan, no cambia nada
 *   node scripts/fix-imagenes.mjs --apply    # aplica los cambios
 *
 * No borra ni inserta productos. Solo hace UPDATE sobre
 * products.imagen_principal, y solo donde el valor actual no coincide
 * con el correcto. Los productos que ya estan bien quedan intactos.
 *
 * Pide DATABASE_URL. Corre backup-db.mjs antes de usar --apply.
 */
import { Client } from 'pg';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');
const conn = process.env.DATABASE_URL;

// slug -> URL correcta (las verificadas con HTTP 200)
const IMAGENES = {
  'mermelada-fresa-artesanal': 'https://images.unsplash.com/photo-1700166581152-5489eb689333?w=600&q=80',
  'mermelada-mora': 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=600&q=80',
  'mermelada-durazno': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80',
  'mermelada-zarzamora': 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=600&q=80',
  'mermelada-mixta-fresa-mora': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80',
  'mermelada-mango-tropical': 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80',
  'mermelada-maracuya-acida': 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80',
  'mermelada-fresa-miel': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  'mermelada-mora-menta': 'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=600&q=80',
  'kit-regalo-3-sabores': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80',
};

if (!conn) {
  console.error('Falta DATABASE_URL.');
  process.exit(1);
}

const client = new Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function main() {
  await client.connect();
  console.log('Conexion OK');

  const { rows } = await client.query('select id, slug, nombre, imagen_principal from products order by slug');

  const cambios = [];
  const sinCambio = [];
  const fueraDeLista = [];

  for (const r of rows) {
    const correcta = IMAGENES[r.slug];
    if (!correcta) { fueraDeLista.push(r); continue; }
    if (r.imagen_principal === correcta) sinCambio.push(r);
    else cambios.push({ ...r, nueva: correcta });
  }

  console.log(`\nProductos totales: ${rows.length}`);
  console.log(`Ya correctos:     ${sinCambio.length}`);
  console.log(`A actualizar:     ${cambios.length}`);
  console.log(`Sin URL en lista: ${fueraDeLista.length}`);

  if (!cambios.length) {
    console.log('\nNada que hacer.');
    await client.end();
    return;
  }

  console.log('\n--- Plan ---');
  for (const c of cambios) {
    console.log(`\n${c.nombre}  (${c.slug})`);
    console.log(`  actual: ${c.imagen_principal ?? '(vacio)'}`);
    console.log(`  nuevo:  ${c.nueva}`);
  }

  if (fueraDeLista.length) {
    console.log('\n--- Sin URL definida (no se tocan) ---');
    for (const f of fueraDeLista) console.log(`  ${f.slug} -> ${f.imagen_principal ?? '(vacio)'}`);
  }

  if (!APPLY) {
    console.log('\nSolo simulacion. Usa --apply para escribir.');
    await client.end();
    return;
  }

  console.log('\nAplicando en una transaccion...');
  try {
    await client.query('BEGIN');
    let n = 0;
    for (const c of cambios) {
      await client.query('update products set imagen_principal = $1 where id = $2', [c.nueva, c.id]);
      n++;
    }
    await client.query('COMMIT');
    console.log(`OK: ${n} productos actualizados.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error, revertido:', e.message);
    await client.end();
    process.exit(1);
  }

  await client.end();
}

main().catch(async (e) => {
  console.error('FALLO:', e.message);
  try { await client.end(); } catch {}
  process.exit(1);
});
