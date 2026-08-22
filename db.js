import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './auth.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const RAIZ = path.resolve(__dirname, '..');
const DATA_DIR = path.join(RAIZ, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'dulce-encanto.db');

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, rol TEXT NOT NULL DEFAULT 'cliente',
    telefono TEXT NOT NULL DEFAULT '', direccion TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE, nombre TEXT NOT NULL,
    tagline TEXT NOT NULL DEFAULT '', descripcion TEXT NOT NULL DEFAULT '',
    ingredientes TEXT NOT NULL DEFAULT '', precio REAL NOT NULL,
    costo REAL NOT NULL, imagen TEXT NOT NULL DEFAULT 'fresa',
    stock INTEGER NOT NULL DEFAULT 0, stock_minimo INTEGER NOT NULL DEFAULT 5,
    disponible INTEGER NOT NULL DEFAULT 1, destacado INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    cliente_nombre TEXT NOT NULL, cliente_email TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL DEFAULT '', cliente_direccion TEXT NOT NULL DEFAULT '',
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo', notas TEXT NOT NULL DEFAULT '',
    subtotal REAL NOT NULL, impuesto REAL NOT NULL, envio REAL NOT NULL,
    total REAL NOT NULL, estado TEXT NOT NULL DEFAULT 'pendiente',
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS pedido_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
    nombre_producto TEXT NOT NULL, imagen TEXT NOT NULL DEFAULT 'fresa',
    precio_unitario REAL NOT NULL, costo_unitario REAL NOT NULL DEFAULT 0,
    cantidad INTEGER NOT NULL, ganancia REAL NOT NULL DEFAULT 0
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS movimientos_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL, cantidad INTEGER NOT NULL,
    stock_resultante INTEGER NOT NULL, referencia TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    para TEXT NOT NULL, asunto TEXT NOT NULL,
    cuerpo_html TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'pendiente',
    error TEXT NOT NULL DEFAULT '', referencia TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL DEFAULT (datetime('now')), enviado_en TEXT
  );
`);

const red2 = (n) => Math.round(n * 100) / 100;
const fecha = (diasAtras = 0, hora = 12) => {
  const d = new Date(Date.now() - diasAtras * 86400000);
  d.setUTCHours(hora, (d.getUTCMinutes() * 7) % 60, 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

function sembrar() {
  const hay = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n > 0;
  if (hay) return;

  console.log('🍓 Sembrando datos base...');
  db.exec('BEGIN');

  // Usuarios: admin + cliente
  const phA = hashPassword('Admin123*');
  const phC = hashPassword('Cliente123*');
  db.prepare('INSERT INTO usuarios (nombre,email,password_hash,rol,telefono,direccion,creado_en) VALUES (?,?,?,?,?,?,?)')
    .run('Dueña Dulce Encanto', 'admin@dulceencanto.com', phA, 'admin',
      '+593 99 123 4567', 'Av. de las Flores 123, Quito', fecha(30));
  db.prepare('INSERT INTO usuarios (nombre,email,password_hash,rol,telefono,direccion,creado_en) VALUES (?,?,?,?,?,?,?)')
    .run('Cliente Demo', 'cliente@demo.com', phC, 'cliente',
      '+593 98 765 4321', 'Calle de las Rosas 45, Quito', fecha(20));

  // 6 productos con stock inicial (usando solo 7 columnas, el resto usa DEFAULT '')
  const prods = [
    ['fresa-clasica', 'Fresa Clásica', 'La favorita de la casa', 40],
    ['mora-andina', 'Mora Andina', 'Intensa y de montaña', 36],
    ['durazno-dorado', 'Durazno Dorado', 'Suave y perfumada', 30],
    ['mango-tropical', 'Mango Tropical', 'Sabor tropical dorado', 24],
    ['frutal-mixta', 'Frutal Mixta', 'Fresa + Mora combinadas', 20],
    ['guayaba-del-campo', 'Guayaba del Campo', 'Aroma a campo', 10]
  ];
const insPro = db.prepare(
    'INSERT INTO productos (slug,nombre,tagline,precio,costo,imagen,stock) VALUES (?,?,?,?,?,?,?)'
  );
  for (const [slug, nombre, tagline, stock] of prods) {
    const img = slug.split('-')[0]; // fresa, mora, durazno, mango, mixta, guayaba
    const [row] = insPro.get(slug, nombre, tagline, 2.50, 1.70, img, stock);
    prodIds.push(row.id);
    // Movimiento inicial de stock
    db.prepare('INSERT INTO movimientos_stock (producto_id,tipo,cantidad,stock_resultante,referencia,creado_en) VALUES (?,\'inicial\',?,?,?)')
      .run(row.id, 'inicial', stock, stock, 'Carga inicial', fecha(28));
  }

  db.exec('COMMIT');
  console.log('✨ Datos base sembrados: ' + prods.length + ' productos, 2 usuarios.');
}

sembrar();