import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from './src/config.js';
import { db } from './src/db.js';
import { router } from './src/api.js';

// BD ya tiene pragmas configurados en src/db.js (WAL + foreign_keys)
// El sembrar de datos se hace automáticamente al primer levantamiento en src/db.js

// === Configuración ===
const PUBLICO = path.join(RAIZ, 'public');

const MIMETYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

// === Servir archivos estáticos ===
function servirArchivo(res, filePath, contentType) {
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'max-age=3600' });
    res.end(data);
  } catch {
    servir404(res);
  }
}

function servir404(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 — No encontrado');
}

function servirIndex(res) {
  servirArchivo(res, path.join(PUBLICO, 'index.html'), MIMETYPES['.html'] || 'text/html');
}

// === Router handler para HTTP server nativo ===
function manejadorPeticiones(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Preflight OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathname = url.pathname;

    // === Rutas de API ===
    if (pathname.startsWith('/api/')) {
      // GET /api/config
      if (pathname === '/api/config' && req.method === 'GET') {
        const obj = {
          iva: CONFIG.IVA,
          costo_envio: CONFIG.COSTO_ENVIO,
          envio_gratis_desde: CONFIG.ENVIO_GRATIS_DESDE,
          negocio: CONFIG.NEGOCIO
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(obj));
        return;
      }

      // GET /api/productos
      if (pathname === '/api/productos' && req.method === 'GET') {
        const q = String(url.searchParams.get('q') || '').toLowerCase().trim();
        const destacados = url.searchParams.get('destacados') === '1';
        let sql = `SELECT p.*, (p.stock < p.stock_minimo) AS bajoStock FROM productos p WHERE 1=1`;
        const pa = [];
        if (destacados) sql += ' AND p.destacado = 1';
        if (q) {
          sql += ' AND (p.nombre LIKE ? OR p.tagline LIKE ? OR p.descripcion LIKE ?)';
          const l = `%${q}%`;
          pa.push(l, l, l);
        }
        sql += ' ORDER BY p.destacado DESC, p.nombre ASC';
        const rows = db.prepare(sql).all(...pa);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(rows));
        return;
      }

      // GET /api/productos/:slugOrId
      if (pathname.startsWith('/api/productos/') && req.method === 'GET') {
        const key = pathname.substring('/api/productos/'.length);
        const row = db.prepare(
          `SELECT p.*, (p.stock < p.stock_minimo) AS bajoStock FROM productos p WHERE p.slug = ? OR p.id = ?`
        ).get(key, key);
        if (!row) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'Producto no encontrado' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(row));
        return;
      }

      // POST /api/auth/registro
      if (pathname === '/api/auth/registro' && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const { nombre, email, password } = parsed;
            if (!nombre || nombre.length < 2) throw new Error('Nombre inválido');
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email inválido');
            if (!password || password.length < 6) throw new Error('Contraseña mínima 6 caracteres');
            db.prepare(
              'INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, direccion, creado_en) VALUES (?,?,?,?,?,?,?)'
            ).run(nombre, email, hashPassword(password), 'cliente', parsed.telefono || '', parsed.direccion || '', fecha());
            const payload = { id: db.lastInsertRowid, rol: 'cliente', nombre: nombre, exp: Math.floor(Date.now() / 1000) + 168 * 3600 };
            const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
            res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ token, usuario: { id: db.lastInsertRowid, nombre, email, rol: 'cliente' } }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // POST /api/auth/login
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const usuario = db.prepare('SELECT * FROM usuarios WHERE email=?').get(parsed.email);
            if (!usuario || !verificarPassword(parsed.password, usuario.password_hash)) {
              res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
              return res.end(JSON.stringify({ error: 'Correo o contraseña incorrectos' }));
            }
            if (usuario.rol === 'admin') {
              res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
              return res.end(JSON.stringify({ error: 'Use el login de administrador' }));
            }
            const payload = { id: usuario.id, rol: 'cliente', nombre: usuario.nombre, exp: Math.floor(Date.now() / 1000) + 168 * 3600 };
            const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // GET /api/auth/me
      if (pathname === '/api/auth/me' && req.method === 'GET') {
        const auth = req.headers['authorization'] || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        const payload = verificarToken(token);
        if (!payload) {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'Token inválido o expirado' }));
        }
        const u = db.prepare('SELECT id,nombre,email,rol,telefono,direccion FROM usuarios WHERE id=?').get(payload.id);
        if (!u) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'Usuario no encontrado' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(u));
        return;
      }

      // POST /api/pedidos (checkout)
      if (pathname === '/api/pedidos' && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const { cliente_nombre, cliente_email, cliente_telefono, cliente_direccion, metodo_pago, items, notas } = parsed;
            if (!cliente_nombre || !cliente_email || !Array.isArray(items) || items.length === 0) {
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
              return res.end(JSON.stringify({ error: 'Datos de cliente e ítems obligatorios' }));
            }
            // Validar productos & stock
            const problemas = [];
            let sub = 0;
            const validados = [];
            for (const it of items) {
              const p = db.prepare('SELECT id, nombre, precio, costo, stock, disponible FROM productos WHERE id=?').get(it.producto_id);
              if (!p) { problemas.push(`Producto ID ${it.producto_id} no existe`); continue; }
              if (!p.disponible) { problemas.push(`El sabor "${p.nombre}" está agotado temporalmente`); continue; }
              if (p.stock < it.cantidad) { problemas.push(`Stock insuficiente para "${p.nombre}" (disponible: ${p.stock}, solicitado: ${it.cantidad})`); continue; }
              validados.push({ ...p, cantidad: it.cantidad });
              sub += p.precio * it.cantidad;
            }
            if (problemas.length) {
              res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
              return res.end(JSON.stringify({ error: `Productos con problemas: ${problemas.join('; ')}` }));
            }
            const impuesto = red2(sub * CONFIG.IVA);
            const envio = sub >= CONFIG.ENVIO_GRATIS_DESDE ? 0 : CONFIG.COSTO_ENVIO;
            const total = red2(sub + impuesto + envio);
            const numero = `DE-${new Date().getFullYear()}-${String(db.prepare('SELECT MAX(id)+1 FROM pedidos').value || 1).padStart(5, '0')}`;

            db.exec('BEGIN');
            try {
              const insPedido = db.prepare(
                `INSERT INTO pedidos (numero,cliente_nombre,cliente_email,cliente_telefono,cliente_direccion,metodo_pago,subtotal,impuesto,envio,total,estado,creado_en) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
              );
              const pedidoId = insPedido.run(numero, cliente_nombre, cliente_email, cliente_telefono, cliente_direccion, metodo_pago || 'efectivo', sub, impuesto, envio, total, 'pendiente', fecha()).lastInsertRowid;

              const insItem = db.prepare(
                `INSERT INTO pedido_items (pedido_id,producto_id,nombre_producto,imagen,precio_unitario,costo_unitario,cantidad,ganancia) VALUES (?,?,?,?,?,?,?,?)`
              );
              const updStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
              const movVenta = db.prepare(
                "INSERT INTO movimientos_stock (producto_id,tipo,cantidad,stock_resultante,referencia,creado_en) VALUES (?,'venta',?,?,?)"
              );

              for (const it of validados) {
                insItem.run(pedidoId, it.id, it.nombre, it.slug.split('-')[0] || 'fresa', it.precio, it.costo, it.cantidad, red2(it.cantidad * 0.8));
                updStock.run(it.cantidad, it.id);
                const nuevoStock = it.stock - it.cantidad;
                movVenta.run(it.id, -it.cantidad, nuevoStock, numero, null, fecha());
                difundir('stock', { producto_id: it.id, producto_nombre: it.nombre, stock: nuevoStock, bajoStock: nuevoStock < it.stock_minimo, referencia: numero });
                if (nuevoStock < it.stock_minimo) {
                  difundir('alerta', { tipo: 'bajo_stock', producto_id: it.id, producto_nombre: it.nombre, stock: nuevoStock, stock_minimo: it.stock_minimo, referencia: numero }, true);
                }
              }

              db.prepare('UPDATE pedidos SET numero=? WHERE id=?').run(numero, pedidoId);

              setImmediate(() => {
                notificarNuevoPedido({ numero, cliente_nombre, cliente_email, cliente_telefono, cliente_direccion, metodo_pago, subtotal: sub, impuesto, envio, total, notas }, validados);
              });

              res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({
                numero,
                cliente_nombre,
                cliente_email,
                cliente_telefono,
                cliente_direccion,
                metodo_pago,
                subtotal: sub,
                impuesto,
                envio,
                total,
                estado: 'pendiente',
                creado_en: fecha(),
                items: validados.length
              }));
              db.exec('COMMIT');
            } catch (e) {
              db.exec('ROLLBACK');
              throw e;
            }
}
          return;
        });
        return;
      }

      // GET /api/pedidos/:numero
      const pedidoMatch = pathname.match(/^\/api\/pedidos\/([^/]+)$/);
      if (pedidoMatch && req.method === 'GET') {
        const numero = pedidoMatch[1];
        const email = String(url.searchParams.get('email') || '').toLowerCase().trim();
        let sql = 'SELECT p.id, p.numero, p.cliente_nombre, p.cliente_email, p.cliente_telefono, p.cliente_direccion, p.metodo_pago, p.subtotal, p.impuesto, p.envio, p.total, p.estado, p.creado_en, pi.id AS item_id, pi.producto_id, pi.nombre_producto, pi.precio_unitario, pi.costo_unitario, pi.cantidad, pi.ganancia FROM pedidos p JOIN pedido_items pi ON pi.pedido_id = p.id WHERE p.numero = ?';
        const pa = [numero];
        if (email) { sql += ' AND LOWER(p.cliente_email) = ?'; pa.push(email); }
        const rows = db.prepare(sql).all(...pa);
        if (!rows.length) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'Pedido no encontrado' }));
        }
        const pedido = {
          id: rows[0].id,
          numero: rows[0].numero,
          cliente_nombre: rows[0].cliente_nombre,
          cliente_email: rows[0].cliente_email,
          cliente_telefono: rows[0].cliente_telefono,
          cliente_direccion: rows[0].cliente_direccion,
          metodo_pago: rows[0].metodo_pago,
          subtotal: rows[0].subtotal,
          impuesto: rows[0].impuesto,
          envio: rows[0].envio,
          total: rows[0].total,
          estado: rows[0].estado,
          creado_en: rows[0].creado_en,
          items: rows.map((r) => ({
            producto_id: r.producto_id,
            nombre_producto: r.nombre_producto,
            imagen: r.slug || 'fresa',
            precio_unitario: r.precio_unitario,
            costo_unitario: r.costo_unitario,
            cantidad: r.cantidad,
            ganancia: r.ganancia
          }))
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(pedido));
        return;
      }

      // GET /api/eventos (SSE público)
      if (pathname === '/api/eventos' && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        SSE_CLIENTES.add({ res, admin: false });
        req.on('close', () => {
          SSE_CLIENTES.delete({ res, admin: false });
        });
        res.write(`event: connected\ndata: {"tipo":"publico"}\n\n`);
        return;
      }

      // Si no matched any API route → servir index.html (SPA fallback)
      servirIndex(res);
      return;
    }

    // Rutas de archivos estáticos
    if (!pathname.startsWith('/api/')) {
      manejadorArchivos(req, res);
      return;
    }
  } catch (e) {
    console.error('Error en servidor:', e);
    try {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error interno del servidor');
    } catch {}
  }
}

// === Servir archivos estáticos bajo /public/ ===
function manejadorArchivos(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  let filepath = path.join(PUBLICO, url.pathname === '/' ? 'index.html' : url.pathname);
  const ext = path.extname(filepath) || '.html';

  const normalized = path.normalize(filepath);
  if (!normalized.startsWith(PUBLICO)) {
    return servir404(res);
  }

  const contentType = MIMETYPES[ext] || 'application/octet-stream';
  if (ext === '.html' && fs.existsSync(filepath)) {
    servirArchivo(res, filepath, MIMETYPES[ext]);
  } else if (ext !== '.html' && fs.existsSync(filepath)) {
    servirArchivo(res, filepath, contentType);
  } else if (ext === '.html' && !fs.existsSync(filepath)) {
    servirIndex(res);
  } else {
    servir404(res);
  }
}

// === Servidor HTTP principal ===
const servidorHttp = createServer((req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
      manejadorPeticiones(req, res);
      return;
    }

    if (!pathname.startsWith('/api/')) {
      manejadorArchivos(req, res);
      return;
    }
  } catch (e) {
    console.error('Error en servidor:', e);
    try {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error interno del servidor');
    } catch {}
  }
});

// === Inicialización ===
const servidorHttp = servidorHttp.listen(CONFIG.PUERTO, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  🍓  DULCE ENCANTO — Tienda de Mermeladas Artesanales    ║`);
  console.log(`║  Full-stack zero-dependency — Node.js + SQLite            ║`);
  console.log(`║                                                             ║`);
  console.log(`║  🌐  http://localhost:${CONFIG.PUERTO.toString().padStart(5, ' ')}         ║`);
  console.log(`║  👤  Admin: admin@dulceencanto.com  /  Admin123*          ║`);
  console.log(`║  👤  Demo:  cliente@demo.com    /  Cliente123*            ║`);
  console.log(`║                                                             ║`);
  console.log(`║  Endpoints principales:`);
  console.log(`║    GET  /api/productos         — catálogo                 ║`);
  console.log(`║    POST /api/pedidos           — checkout                 ║`);
  console.log(`║    GET  /api/pedidos/:num      — ver pedido               ║`);
  console.log(`║    POST /api/auth/registro     — registrarse              ║`);
  console.log(`║    POST /api/auth/login        — login cliente            ║`);
  console.log(`║    GET  /api/auth/me           — perfil (auth)            ║`);
  console.log(`║    GET  /api/config            — configuración            ║`);
  console.log(`║    WS/SSE /api/eventos         — actualizaciones tiempo real║`);
  console.log(`║    GET  /api/admin/*           — panel administrador       ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
});

process.on('SIGINT', () => {
  db.close();
  servidorHttp.close();
  process.exit(0);
});