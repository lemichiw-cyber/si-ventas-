import crypto from 'node:crypto';
import { db } from './db.js';
import { CONFIG } from './config.js';
import { hashPassword, verificarPassword, verificarToken, usuarioDePeticion } from './auth.js';
import { HttpError, Router, leerCuerpo } from './http.js';
import { enviarId, reintentarPendientes, notificarNuevoPedido, registrarEmail } from './mailer.js';

const router = new Router();

const red2 = (n) => Math.round(n * 100) / 100;
const fecha = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
function emitirToken(payload, horas = 24) {
  const cuerpo = { ...payload, exp: Math.floor(Date.now() / 1000) + horas * 3600 };
  const data = b64u(JSON.stringify(cuerpo));
  return `${data}.${firmaToken(data)}`;
}

const b64u = (data) => Buffer.from(data).toString('base64url');
const firmaToken = (data) => {
  return crypto.createHmac('sha256', CONFIG.JWT_SECRETO).update(data).digest('base64url');
};

function authHeader(req) {
  const h = req.headers['authorization'] || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

// --- CONFIGURACIÓN GLOBAL ---
const SSE_CLIENTES = new Set(); // {res, admin: boolean}
let HEARTBEAT_INTERVAL = null;

function difundir(evento, datos, soloAdmin = false) {
  const msg = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  for (const { res, admin } of SSE_CLIENTES) {
    if (!soloAdmin || admin) {
      try { res.write(msg); } catch { /* conexión caída */ }
    }
  }
}

function iniciarHeartbeat() {
  if (HEARTBEAT_INTERVAL) clearInterval(HEARTBEAT_INTERVAL);
  HEARTBEAT_INTERVAL = setInterval(() => {
    const msg = `event: heartbeat\ndata: {"ts":${Date.now()}}\n\n`;
    for (const { res } of SSE_CLIENTES) {
      try { res.write(msg); } catch { /* cerró */ }
    }
  }, 25000);
}

// --- RUTAS PÚBLICAS (SIN autenticación) ---

// 1. Configuración del negocio
router.get('/config', (ctx) => {
  ctx.json(200, {
    moneda: CONFIG.MONEDA,
    catalogo_sin_venta: CONFIG.CATALOGO_SIN_VENTA,
    pago_tarjeta: CONFIG.STRIPE_ENABLED,
    metodos_pago: CONFIG.METODOS_PAGO_VALIDOS,
    iva: CONFIG.IVA,
    costo_envio: CONFIG.COSTO_ENVIO,
    envio_gratis_desde: CONFIG.ENVIO_GRATIS_DESDE,
    negocio: CONFIG.NEGOCIO
  });
});

// 2. Catálogo: todos los productos (puede filtrar destacado, búsqueda q)
router.get('/productos', (ctx) => {
  const destacados = String(ctx.request.query?.destacados) === '1';
  const q = String(ctx.request.query?.q || '').toLowerCase().trim();
  let sqlBase = `SELECT p.*, (p.stock < p.stock_minimo) AS bajoStock FROM productos p WHERE 1=1`;
  const params = [];
  if (destacados) {
    sqlBase += ' AND p.destacado = 1';
  }
  if (q) {
    sqlBase += ' AND (p.nombre LIKE ? OR p.tagline LIKE ? OR p.descripcion LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sqlBase += ' ORDER BY p.destacado DESC, p.nombre ASC';
  const rows = db.prepare(sqlBase).all(...params);
  ctx.json(200, rows);
});

// 3. Ficha de producto por slug/id
router.get('/productos/:slugOrId', (ctx) => {
  const key = ctx.params.slugOrId;
  const row = db.prepare(
    `SELECT p.*, (p.stock < p.stock_minimo) AS bajoStock FROM productos p WHERE p.slug = ? OR p.id = ?`
  ).get(key, key);
  if (!row) throw new HttpError(404, 'Producto no encontrado');
  ctx.json(200, row);
});

// 4. Registro de cliente
router.post('/auth/registro', async (ctx) => {
  const body = await leerCuerpo(ctx.req);
  const { nombre, email, password } = body;
  if (!nombre || nombre.length < 2) throw new HttpError(400, 'Nombre inválido');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Email inválido');
  if (!password || password.length < 6) throw new HttpError(400, 'Contraseña mínima 6 caracteres');
  try {
    db.prepare(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, direccion, creado_en) VALUES (?,?,?,?,?,?,?)'
    ).run(nombre, email, hashPassword(password), 'cliente', body.telefono || '', body.direccion || '', fecha());
    // Token simple de bienvenida (demo)
    const token = emitirToken({ id: Number(db.lastInsertRowid), rol: 'cliente', nombre });
    ctx.json(201, { token, usuario: { id: db.lastInsertRowid, nombre, email, rol: 'cliente' } });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(500, 'Error interno — email ya registrado');
  }
});

// 5a. Login de administrador
router.post('/auth/admin', async (ctx) => {
  const body = await leerCuerpo(ctx.req);
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email=?').get(body.email);
  if (!usuario || usuario.rol !== 'admin' || !verificarPassword(body.password, usuario.password_hash)) {
    throw new HttpError(401, 'Credenciales de administrador incorrectas');
  }
  const token = emitirToken({ id: usuario.id, rol: 'admin', nombre: usuario.nombre }, 12);
  ctx.json(200, { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: 'admin' } });
});

// SSE público: actualizaciones de stock para el catálogo
router.get('/eventos', (ctx) => {
  const res = ctx.res;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write(`event: connected\ndata: {"ok":true}\n\n`);
  SSE_CLIENTES.add({ res, admin: false });
  ctx.req.on('close', () => SSE_CLIENTES.delete({ res, admin: false }));
});

// 5. Login cliente
router.post('/auth/login', async (ctx) => {
  const body = await leerCuerpo(ctx.req);
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email=?').get(body.email);
  if (!usuario || !verificarPassword(body.password, usuario.password_hash)) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  if (usuario.rol === 'admin') throw new HttpError(401, 'Use el login de administrador');
  const token = emitirToken({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre });
  ctx.json(200, { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
});

// 6. Perfil del usuario logueado
router.get('/auth/me', (ctx) => {
  const token = authHeader(ctx.req);
  const payload = verificarToken(token);
  if (!payload) throw new HttpError(401, 'Token inválido o expirado');
  const u = db.prepare('SELECT id,nombre,email,rol,telefono,direccion FROM usuarios WHERE id=?').get(payload.id);
  if (!u) throw new HttpError(404, 'Usuario no encontrado');
  ctx.json(200, u);
});

// 7. Realizar pedido (checkout)
router.post('/pedidos', async (ctx) => {
  const body = await leerCuerpo(ctx.req);
  const { cliente_nombre, cliente_email, cliente_telefono, cliente_direccion, metodo_pago, items, notas } = body;
  const metodoValido = CONFIG.METODOS_PAGO.includes(metodo_pago || 'efectivo');
  if (!metodoValido) throw new HttpError(400, 'Método de pago inválido');
  if (!cliente_nombre || !cliente_email || !Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Datos de cliente e ítems obligatorios');
  }
  // Valida productos & stock
  const problemas = [];
  const validados = items.map((it) => {
    const p = db.prepare('SELECT id, slug, nombre, stock, disponible, precio, costo FROM productos WHERE id=? OR slug=?').get(it.producto_id, it.producto_id);
    if (!p) return { ok: false, msg: `Producto ID ${it.producto_id} no existe` };
    if (!p.disponible) return { ok: false, msg: `El sabor "${p.nombre}" está agotado temporalmente` };
    if (p.stock < it.cantidad) return { ok: false, msg: `Stock insuficiente para "${p.nombre}" (disponible: ${p.stock}, solicitado: ${it.cantidad})` };
    return { ok: true, p };
  });
  const fallidos = validados.filter((v) => !v.ok);
  if (fallidos.length) {
    throw new HttpError(409, `Productos con problemas: ${fallidos.map((f) => f.msg).join('; ')}`);
  }

  // Totales con cupón opcional
  let sub = 0;
  for (const it of items) {
    const p = db.prepare('SELECT precio FROM productos WHERE id=? OR slug=?').get(it.producto_id, it.producto_id);
    if (!p) throw new HttpError(400, `Producto ${it.producto_id} no existe`);
    sub += p.precio * it.cantidad;
  }
  sub = red2(sub);

  let descuento = 0;
  let cuponAplicado = '';
  const codigoCupon = String(body.cupon_codigo || '').trim().toUpperCase();
  if (codigoCupon) {
    const c = db.prepare('SELECT * FROM cupones WHERE codigo=? AND activo=1').get(codigoCupon);
    if (!c) throw new HttpError(400, 'Cupón no válido');
    descuento = c.tipo === 'porcentaje' ? red2(sub * c.valor / 100) : red2(Math.min(c.valor, sub));
    cuponAplicado = c.codigo;
  }

  const impuesto = red2((sub - descuento) * CONFIG.IVA);
  const envio = (sub - descuento) >= CONFIG.ENVIO_GRATIS_DESDE ? 0 : CONFIG.COSTO_ENVIO;
  const total = Math.max(0, red2(sub - descuento + impuesto + envio));
  const subtotal = sub;
  const siguiente = db.prepare('SELECT COUNT(*) AS n FROM pedidos').get().n + 1;
  const numero = `DE-${new Date().getFullYear()}-${String(siguiente).padStart(5, '0')}`;

  db.exec('BEGIN');
  try {
    // Insertar pedido (temporal, numero se llena luego)
    const insPedido = db.prepare(
      `INSERT INTO pedidos (numero,cliente_nombre,cliente_email,cliente_telefono,cliente_direccion,metodo_pago,descuento,cupon,subtotal,impuesto,envio,total,estado,creado_en)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );
    const pedidoId = insPedido.run(numero, cliente_nombre, cliente_email, cliente_telefono || '', cliente_direccion || '', metodo_pago || 'efectivo', descuento, cuponAplicado, sub, impuesto, envio, total, 'pendiente', fecha()).lastInsertRowid;

    // Insertar ítems y decrementar stock
    const insItem = db.prepare(
      `INSERT INTO pedido_items (pedido_id,producto_id,nombre_producto,imagen,precio_unitario,costo_unitario,cantidad,ganancia) VALUES (?,?,?,?,?,?,?,?)`
    );
    const updStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
    const movVenta = db.prepare(
      "INSERT INTO movimientos_stock (producto_id,tipo,cantidad,stock_resultante,referencia,creado_en) VALUES (?,'venta',?,?,?,?)"
    );

    for (const it of items) {
      const p = db.prepare('SELECT id, slug, nombre, precio, costo, stock, stock_minimo FROM productos WHERE id=?').get(it.producto_id);
      insItem.run(pedidoId, p.id, p.nombre, p.slug.split('-')[0] || 'fresa', p.precio, p.costo, it.cantidad, red2(it.cantidad * 0.8));
      updStock.run(it.cantidad, p.id);
      const nuevoStock = p.stock - it.cantidad;
      movVenta.run(p.id, -it.cantidad, nuevoStock, numero, fecha());
      // Broadcast stock actualizado
      difundir('stock', { producto_id: p.id, producto_nombre: p.nombre, stock: nuevoStock, bajoStock: nuevoStock < p.stock_minimo, referencia: numero });
      // Si cruzó al bajo stock, alerta admin
      if (nuevoStock < p.stock_minimo && p.stock >= p.stock_minimo) {
        difundir('alerta', { tipo: 'bajo_stock', producto_id: p.id, producto_nombre: p.nombre, stock: nuevoStock, stock_minimo: p.stock_minimo, referencia: numero }, true);
      }
    }

    // Actualizar número de orden (ya hay id)
    

    // Email notification async
    notificarNuevoPedido({ numero, cliente_nombre, cliente_email, cliente_telefono, cliente_direccion, metodo_pago, subtotal, impuesto, envio, total, notas }, items);

    ctx.json(201, {
      numero,
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      cliente_direccion,
      metodo_pago,
      subtotal,
      descuento,
      cupon: cuponAplicado || null,
      impuesto,
      envio,
      total,
      estado: 'pendiente',
      creado_en: fecha(),
      items: items.length
    });
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
});

// 8. Ver pedido por número
router.get('/pedidos/:numero', (ctx) => {
  const numero = ctx.params.numero;
  // Buscar por número y email opcional para seguridad mínima
  const email = String(ctx.request.query?.email || '').toLowerCase().trim();
  let sql = 'SELECT p.id, p.numero, p.cliente_nombre, p.cliente_email, p.cliente_telefono, p.cliente_direccion, p.metodo_pago, p.subtotal, p.impuesto, p.envio, p.total, p.estado, p.creado_en, pi.id AS item_id, pi.producto_id, pi.nombre_producto, pi.precio_unitario, pi.costo_unitario, pi.cantidad, pi.ganancia FROM pedidos p JOIN pedido_items pi ON pi.pedido_id = p.id WHERE p.numero = ?';
  const params = [numero];
  if (email) {
    sql += ' AND LOWER(p.cliente_email) = ?';
    params.push(email);
  }
  const row = db.prepare(sql).all(...params);
  if (!row.length) throw new HttpError(404, 'Pedido no encontrado');
  // Agrupar pedido único
  const pedido = {
    id: row[0].id,
    numero: row[0].numero,
    cliente_nombre: row[0].cliente_nombre,
    cliente_email: row[0].cliente_email,
    cliente_telefono: row[0].cliente_telefono,
    cliente_direccion: row[0].cliente_direccion,
    metodo_pago: row[0].metodo_pago,
    subtotal: row[0].subtotal,
    impuesto: row[0].impuesto,
    envio: row[0].envio,
    total: row[0].total,
    estado: row[0].estado,
    creado_en: row[0].creado_en,
    items: row.map((r) => ({
      producto_id: r.producto_id,
      nombre_producto: r.nombre_producto,
      imagen: r.slug || 'fresa',
      precio_unitario: r.precio_unitario,
      costo_unitario: r.costo_unitario,
      cantidad: r.cantidad,
      ganancia: r.ganancia
    }))
  };
  // Eliminar duplicados de estructura
  const uniq = [...new Set(pedido.items.map((it) => it.producto_id))];
  ctx.json(200, pedido);
});

// --- CUPONES ---
router.post('/cupones/validar', async (ctx) => {
  const body = await leerCuerpo(ctx.req);
  const codigo = String(body.codigo || '').trim().toUpperCase();
  const subtotal = Number(body.subtotal) || 0;
  const c = db.prepare('SELECT * FROM cupones WHERE codigo=? AND activo=1').get(codigo);
  if (!c) throw new HttpError(404, 'Cupón no válido');
  const descuento = c.tipo === 'porcentaje'
    ? red2(subtotal * c.valor / 100)
    : red2(Math.min(c.valor, subtotal));
  ctx.json(200, { codigo: c.codigo, tipo: c.tipo, valor: c.valor, descuento });
});

// --- RUTAS DE ADMINISTRADOR (requiere JWT + rol admin) ---

function requireAdmin(ctx) {
  const token = authHeader(ctx.req);
  const payload = verificarToken(token);
  if (!payload) throw new HttpError(401, 'Token inválido o expirado');
  if (payload.rol !== 'admin') throw new HttpError(403, 'Acceso denegado — se requiere rol de administrador');
  ctx.user = { id: payload.id, rol: payload.rol, nombre: payload.nombre };
}

// SSE admin
router.get('/admin/eventos', (ctx) => {
  const token = authHeader(ctx.req);
  const payload = verificarToken(token);
  if (!payload || payload.rol !== 'admin') {
    ctx.req.socket.destroy ? ctx.req.socket.destroy() : ctx.throw(401);
    return;
  }
  const res = ctx.res;
  SSE_CLIENTES.add({ res, admin: true });
  ctx.req.on('close', () => SSE_CLIENTES.delete({ res, admin: true }));
  // Enviar mensaje de bienvenida + heartbeat
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write(`event: connected\ndata: {"admin":true}\n\n`);
  if (!HEARTBEAT_INTERVAL) iniciarHeartbeat();
  // Mantener conexión abierta (no cerrar respuesta aún, el cliente la mantiene)
});

// Dashboard resumen
router.get('/admin/resumen', (ctx) => {
  requireAdmin(ctx);
  const kpis = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM pedidos WHERE estado != 'cancelado') AS pedidos_totales,
      COALESCE((SELECT SUM(total) FROM pedidos WHERE estado != 'cancelado'),0) AS ventas_totales,
      COALESCE((SELECT SUM(cantidad) FROM pedido_items pi JOIN pedidos p ON p.id=pi.pedido_id WHERE p.estado != 'cancelado'),0) AS unidades_vendidas,
      COALESCE((SELECT SUM(ganancia) FROM pedido_items pi JOIN pedidos p ON p.id=pi.pedido_id WHERE p.estado != 'cancelado'),0) AS ganancia_total
  `).get();
  // Ventas últimos 14 días para gráfico de línea
  const ventasDia = db.prepare(`
    SELECT date(creado_en) AS d, COUNT(*) AS n, COALESCE(SUM(total),0) AS total
    FROM pedidos WHERE estado != 'cancelado' AND creado_en >= datetime('now','-13 days')
    GROUP BY date(creado_en) ORDER BY d ASC
  `).all();
  // Llenar días faltantes
  const dias = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const existe = ventasDia.find((v) => v.d === iso);
    dias.push({ fecha: iso, pedidos: existe ? existe.n : 0, ventas: existe ? red2(existe.total) : 0 });
  }
  // Top sabores vendidos
  const topSabores = db.prepare(`
    SELECT pi.nombre_producto, SUM(pi.cantidad) AS unidades, COALESCE(SUM(pi.ganancia),0) AS ganancia
    FROM pedido_items pi
    JOIN pedidos p ON p.id = pi.pedido_id
    WHERE p.estado != 'cancelado'
    GROUP BY pi.nombre_producto
    ORDER BY unidades DESC
    LIMIT 5
  `).all();
  // Estados de pedidos
  const estados = db.prepare(`
    SELECT estado, COUNT(*) AS cantidad, COALESCE(SUM(total),0) AS total
    FROM pedidos
    GROUP BY estado
  `).all();
  // Métodos de pago
  const metodos = db.prepare(`
    SELECT metodo_pago, COUNT(*) AS cantidad, COALESCE(SUM(total),0) AS total
    FROM pedidos
    GROUP BY metodo_pago
  `).all();
  // Stock bajo
  const bajoStock = db.prepare(`
    SELECT id, nombre, slug, stock, stock_minimo, disponible, destacado FROM productos WHERE stock < stock_minimo ORDER BY stock ASC
  `).all();
  // Últimos pedidos
  const ultimosPedidos = db.prepare(`
    SELECT p.numero, p.estado, p.total, p.cliente_nombre, p.creado_en, pi.cantidad
    FROM pedidos p
    JOIN pedido_items pi ON pi.pedido_id = p.id
    ORDER BY p.id DESC
    LIMIT 8
  `).all();
  // Clientes
  const clientes = db.prepare(`
    SELECT u.id, u.nombre, u.email, COUNT(p.id) AS pedidos_count, COALESCE(SUM(p.total),0) AS total_gastado
    FROM usuarios u
    LEFT JOIN pedidos p ON p.usuario_id = u.id
    GROUP BY u.id
    ORDER BY total_gastado DESC
    LIMIT 10
  `).all();

  ctx.json(200, {
    kpis,
    ventas_por_dia: dias,
    top_sabores: topSabores,
    estados,
    metodos_pago: metodos,
    bajo_stock: bajoStock,
    ultimos_pedidos: ultimosPedidos,
    clientes
  });
});

// Pedidos: listar (con filtro opcional por estado)
router.get('/admin/pedidos', (ctx) => {
  requireAdmin(ctx);
  const filtro = String(ctx.request.query?.estado || '');
  let sql = 'SELECT p.id, p.numero, p.cliente_nombre, p.cliente_email, p.cliente_telefono, p.metodo_pago, p.subtotal, p.impuesto, p.envio, p.total, p.estado, p.creado_en, pi.cantidad, pi.nombre_producto FROM pedidos p LEFT JOIN pedido_items pi ON pi.pedido_id = p.id WHERE 1=1';
  const params = [];
  if (filtro) {
    sql += ' AND p.estado = ?';
    params.push(filtro);
  }
  sql += ' ORDER BY p.id DESC';
  const rows = db.prepare(sql).all(...params);
  // Agrupar por pedido
  const pedidosMap = new Map();
  for (const r of rows) {
    const pid = r.id;
    if (!pedidosMap.has(pid)) {
      pedidosMap.set(pid, {
        id: pid,
        numero: r.numero,
        cliente_nombre: r.cliente_nombre,
        cliente_email: r.cliente_email,
        cliente_telefono: r.cliente_telefono,
        metodo_pago: r.metodo_pago,
        subtotal: r.subtotal,
        impuesto: r.impuesto,
        envio: r.envio,
        total: r.total,
        estado: r.estado,
        creado_en: r.creado_en,
        items: []
      });
    }
    if (r.cantidad !== undefined) pedidosMap.get(pid).items.push({
      producto_id: null, // no tenemos producto directo aquí, recuperar si hace falta
      nombre_producto: r.nombre_producto,
      cantidad: r.cantidad
    });
  }
  ctx.json(200, Array.from(pedidosMap.values()));
});

// PATCH actualizar estado de pedido
router.patch('/admin/pedidos/:id/estado', async (ctx) => {
  const body = await leerCuerpo(ctx.req);
  requireAdmin(ctx);
  const { id } = ctx.params;
  const { estado } = body;
  if (!['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'].includes(estado)) {
    throw new HttpError(400, 'Estado inválido; use: pendiente|pagado|enviado|entregado|cancelado');
  }
  const pedido = db.prepare('SELECT id, numero, estado FROM pedidos WHERE id=?').get(id);
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');

  // Si se cancela, restaurar stock
  if (estado === 'cancelado' && pedido.estado !== 'cancelado' && pedido.estado !== 'entregado') {
    const items = db.prepare('SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id=?').all(id);
    for (const it of items) {
      db.prepare('UPDATE productos SET stock = stock + ? WHERE id=?').run(it.cantidad, it.producto_id);
      db.prepare("INSERT INTO movimientos_stock (producto_id,tipo,cantidad,stock_resultante,referencia,tipo_movimiento,creado_en) VALUES (?,'devolucion',?,?,?,?,?)")
        .run(it.producto_id, it.cantidad, it.producto_id, `Devolución cancelación ${pedido.numero}`, fecha());
    }
    difundir('stock', { producto_id: null, producto_nombre: null, stock: null, referencia: `cancelación-${pedido.numero}` }, true);
  }

  const upd = db.prepare('UPDATE pedidos SET estado=? WHERE id=?').run(estado, id);
  ctx.json(200, { id, estado });
});

// --- PRODUCTOS (CRUD administrador) ---

// POST nuevo producto
router.post('/admin/productos', async (ctx) => {
  requireAdmin(ctx);
  const body = await leerCuerpo(ctx.req);
  const { nombre, tagline, descripcion, ingredientes, precio, costo, imagen, destacado, disponible, stock_minimo } = body;
  if (!nombre) throw new HttpError(400, 'Nombre obligatorio');
  const slug = body.slug || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'producto';
  // Verificar slug único
  const existente = db.prepare('SELECT id FROM productos WHERE slug=?').get(slug);
  if (existente) throw new HttpError(409, 'Ya existe un producto con ese nombre/Slug');

  // Imagen por defecto si no se envía
  const img = imagen || ['fresa', 'mora', 'durazno', 'mango', 'guayaba', 'mixta'][Math.floor(Math.random() * 6)];

  const res = db.prepare(
    `INSERT INTO productos (slug,nombre,tagline,descripcion,ingredientes,precio,costo,imagen,disponible,destacado,stock_minimo,stock,creado_en)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,0,datetime('now'))`
  ).run(slug, nombre, tagline || '', descripcion || '', ingredientes || '', Number(precio), Number(costo), img, !!disponible, !!destacado, Number(stock_minimo) || 5);

  ctx.json(201, { id: res.lastInsertRowid, ...body, slug });
});

// PUT editar producto (parcial)
router.put('/admin/productos/:id', async (ctx) => {
  requireAdmin(ctx);
  const { id } = ctx.params;
  const body = await leerCuerpo(ctx.req);
  const campos = ['nombre', 'tagline', 'descripcion', 'ingredientes', 'precio', 'costo', 'imagen', 'disponible', 'destacado', 'stock_minimo', 'slug'];
  const updates = Object.fromEntries(campos.filter((k) => k in body).map((k) => [k, body[k]]));
  if (!updates.nombre && !updates.slug) throw new HttpError(400, 'Al menos nombre o slug deben enviarse');

  // Validar slug único si se cambia
  if (updates.slug) {
    const existente = db.prepare('SELECT id FROM productos WHERE slug=? AND id!=?').get(updates.slug, Number(id));
    if (existente) throw new HttpError(409, 'Ese slug ya está en uso por otro producto');
  }

  const set = Object.entries(updates).map(([k, v], i) => `${k}=?`).join(', ');
  const vals = [...Object.values(updates), Number(id)];
  db.prepare(`UPDATE productos SET ${set} WHERE id=?`).run(...vals);
  ctx.json(200, { id: Number(id), ...updates });
});

// DELETE producto (soft: set disponible=0 si hay referencias; hard si no)
router.delete('/admin/productos/:id', (ctx) => {
  requireAdmin(ctx);
  const { id } = ctx.params;
  const referenciado = db.prepare('SELECT COUNT(*) AS c FROM pedido_items WHERE producto_id=?').get(Number(id)).c;
  if (referenciado > 0) {
    db.prepare('UPDATE productos SET disponible=0 WHERE id=?').run(Number(id));
    ctx.json(200, { archivado: true, mensaje: 'Producto archivado (tiene pedidos previos)' });
  } else {
    db.prepare('DELETE FROM productos WHERE id=?').run(Number(id));
    ctx.json(200, { eliminado: true });
  }
});

// PATCH stock producto (delta o cantidad absoluta, con motivo)
router.patch('/admin/productos/:id/stock', async (ctx) => {
  requireAdmin(ctx);
  const { id } = ctx.params;
  const body = await leerCuerpo(ctx.req);
  const { delta, cantidad, motivo } = body;
  if (delta === undefined && cantidad === undefined) {
    throw new HttpError(400, 'Enviar delta (entero, positivo o negativo) o cantidad (entero positivo)');
  }
  let nuevoStock;
  if (delta !== undefined) {
    const p = db.prepare('SELECT stock, stock_minimo FROM productos WHERE id=?').get(Number(id));
    if (!p) throw new HttpError(404, 'Producto no encontrado');
    const result = p.stock + delta;
    if (result < 0) throw new HttpError(400, 'El stock no puede ser negativo');
    nuevoStock = result;
    db.prepare('UPDATE productos SET stock=? WHERE id=?').run(nuevoStock, Number(id));
    db.prepare("INSERT INTO movimientos_stock (producto_id,tipo,cantidad,stock_resultante,referencia,creado_en) VALUES (?,'ajuste',?,?,?,?)")
      .run(Number(id), delta, nuevoStock, motivo || 'Ajuste panel admin', fecha());
  } else {
    const p = db.prepare('SELECT stock, stock_minimo FROM productos WHERE id=?').get(Number(id));
    if (!p) throw new HttpError(404, 'Producto no encontrado');
    if (cantidad < 0) throw new HttpError(400, 'La cantidad debe ser >= 0');
    nuevoStock = cantidad;
    db.prepare('UPDATE productos SET stock=? WHERE id=?').run(nuevoStock, Number(id));
    db.prepare("INSERT INTO movimientos_stock (producto_id,tipo,cantidad,stock_resultante,referencia,creado_en) VALUES (?,'ajuste',?,?,?,?)")
      .run(Number(id), -cantidad, nuevoStock, motivo || 'Reposición panel admin', fecha());
  }
  const bajoAnterior = db.prepare('SELECT stock_minimo FROM productos WHERE id=?').get(Number(id)).stock_minimo;
  const ahoraBajo = nuevoStock < bajoAnterior;
  const antesBajo = db.prepare('SELECT stock FROM productos WHERE id=?').get(Number(id)).stock; // read before update already applied, get from all
  // Emitir evento SSE
  difundir('stock', { producto_id: Number(id), producto_nombre: null, stock: nuevoStock, bajoStock: ahoraBajo, referencia: `ajuste-${delta || cantidad}` }, true);
  if (ahoraBajo && !antesBajo) {
    // Solo si recién entró en bajo stock
    difundir('alerta', { tipo: 'bajo_stock', producto_id: Number(id), producto_nombre: null, stock: nuevoStock, stock_minimo: bajoAnterior, referencia: `ajuste-${delta || cantidad}` }, true);
  }
  ctx.json(200, { id: Number(id), stock: nuevoStock, delta, cantidad, motivo });
});

// Inventario movimientos recientes
router.get('/admin/movimientos', (ctx) => {
  requireAdmin(ctx);
  const limit = Number(ctx.request.query?.limit) || 20;
  const rows = db.prepare(`
    SELECT ms.id, ms.tipo, ms.cantidad, ms.stock_resultante, ms.referencia, ms.creado_en,
           p.nombre AS producto_nombre
    FROM movimientos_stock ms
    LEFT JOIN productos p ON ms.producto_id = p.id
    ORDER BY ms.id DESC
    LIMIT ?
  `).all(limit);
  ctx.json(200, rows);
});

// Clientes (lista resumida)
router.get('/admin/clientes', (ctx) => {
  requireAdmin(ctx);
  const rows = db.prepare(`
    SELECT u.id, u.nombre, u.email, u.telefono, u.direccion, u.rol, u.creado_en,
           COUNT(p.id) AS pedidos_count, COALESCE(SUM(p.total),0) AS total_gastado
    FROM usuarios u
    LEFT JOIN pedidos p ON p.usuario_id = u.id
    GROUP BY u.id
    ORDER BY total_gastado DESC
  `).all();
  ctx.json(200, rows);
});

// Emails (lista + reenviar)
router.get('/admin/emails', (ctx) => {
  requireAdmin(ctx);
  const limit = Number(ctx.request.query?.limit) || 20;
  const rows = db.prepare(
    `SELECT id, para, asunto, estado, referencia, creado_en, enviado_en FROM emails ORDER BY id DESC LIMIT ?`
  ).all(limit);
  ctx.json(200, rows);
});

// Reenviar email pendiente
router.post('/admin/emails/:id/reenviar', (ctx) => {
  requireAdmin(ctx);
  const { id } = ctx.params;
  const email = db.prepare('SELECT * FROM emails WHERE id=?').get(Number(id));
  if (!email) throw new HttpError(404, 'Email no encontrado');
  if (email.estado !== 'pendiente') throw new HttpError(400, 'Solo se pueden reenviar emails pendientes');
  (async () => { await enviarId(email); })().catch(() => {});
  ctx.json(200, { id: Number(id), reenviado: true });
});

// Inicializar heartbeat global al cargar
iniciarHeartbeat();

export { router };



// ── Import/Export CSV de productos ──
function parsearCSV(texto) {
  const filas = String(texto).replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (!filas.length) return [];
  const sep = filas[0].includes(';') && !filas[0].includes(',') ? ';' : ',';
  const cabeceras = filas[0].split(sep).map(h => h.trim().toLowerCase());
  return filas.slice(1).map(linea => {
    const celdas = linea.split(sep);
    const obj = {};
    cabeceras.forEach((h, i) => { obj[h] = (celdas[i] || '').trim(); });
    return obj;
  });
}

router.get('/admin/productos.csv', async (ctx) => {
  requireAdmin(ctx);
  const rows = db.prepare(
    'SELECT slug, nombre, tagline, precio, costo, stock FROM productos ORDER BY id'
  ).all();
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = ['slug,nombre,tagline,precio,costo,stock']
    .concat(rows.map(r => [r.slug, esc(r.nombre), esc(r.tagline), r.precio, r.costo, r.stock].join(',')))
    .join('\n');
  ctx.res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="productos.csv"'
  });
  ctx.res.end(csv);
});

router.post('/admin/productos/importar', async (ctx) => {
  requireAdmin(ctx);
  const body = await leerCuerpo(ctx.req);
  const filas = parsearCSV(body.csv || '');
  let creados = 0, actualizados = 0, errores = [];
  for (const f of filas) {
    if (!f.slug || !f.nombre) { errores.push('fila sin slug/nombre'); continue; }
    const precio = Number(f.precio) || 0;
    const costo = Number(f.costo) || 0;
    const stock = parseInt(f.stock) || 0;
    const ex = db.prepare('SELECT id, stock FROM productos WHERE slug=?').get(f.slug);
    if (ex) {
      db.prepare('UPDATE productos SET nombre=?, tagline=?, precio=?, costo=?, stock=? WHERE id=?')
        .run(f.nombre, f.tagline || '', precio, costo, stock, ex.id);
      actualizados++;
    } else {
      db.prepare('INSERT INTO productos (slug,nombre,tagline,precio,costo,imagen,stock) VALUES (?,?,?,?,?,?,?)')
        .run(f.slug, f.nombre, f.tagline || '', precio, costo, (f.slug.split('-')[0] || 'fresa'), stock);
      creados++;
    }
  }
  ctx.json(200, { creados, actualizados, errores, total: filas.length });
});


