/* ==========================================
   DULCE ENCANTO — App SPA (Single Page Application)
   Motor de rutas, estado, API wrapper, vistas
   ========================================== */

import { frutaSvg, frascoSvg, corazonSvg, cintaSvg, getSvgKey } from './svg.js';
import { graficoLineas, graficoBarras, graficoDonut } from './charts.js';

// --- Estado global ---
const estado = {
  token: localStorage.getItem('dulce-token') || null,
  usuario: JSON.parse(localStorage.getItem('dulce-usuario') || 'null'),
  carrito: JSON.parse(localStorage.getItem('dulce-carrito') || '[]'),
  sseClientes: new Set(),
  config: null
};

// --- Elementos DOM reutilizados ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const toastContainer = $('#toast-container') || (() => { const d = document.createElement('div'); d.id = 'toast-container'; document.body.appendChild(d); return d })();

// --- Utilidades ---
let productData = [];
let cuponActivo = null; // {codigo, descuento}

// Decodifica el payload de un token firmado (solo lectura de UI, sin verificación de firma)
const decodificarPayload = (token = '') => {
  try {
    const b64 = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch { return null; }
};

const esCatalogo = () => estado.config?.catalogo_sin_venta === true;
const fmtDinero = (n) => {
  const m = estado.config?.moneda || { simbolo: '$', posicion: 'antes' };
  const num = Number(n || 0).toFixed(2);
  return m.posicion === 'despues' ? `${num} ${m.simbolo}` : `${m.simbolo}${num}`;
};
const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICONOS_TOAST = { éxito: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
let toastActivo = null;
const showToast = (msg, tipo = 'éxito') => {
  // Un solo toast visible a la vez (el anterior se descarga al instante)
  if (toastActivo) toastActivo.remove();
  clearTimeout(toastActivo && toastActivo._t);
  const icono = ICONOS_TOAST[tipo] || ICONOS_TOAST['éxito'];
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<span class="toast-icono">${icono}</span><span>${esc(msg)}</span>`;
  toast.querySelector('.toast-icono').addEventListener('click', () => cerrarToast(toast));
  toastActivo = toast;
  toastContainer.appendChild(toast);
  toast._t = setTimeout(() => cerrarToast(toast), 3200);
  function cerrarToast(t) {
    if (!t.isConnected) return;
    t.classList.add('toast-salida');
    setTimeout(() => t.remove(), 260);
  }
  setTimeout(() => toast.remove(), 3000);
};

// --- API Wrapper ---
const API_BASE = '/api';

const api = async (endpoint, options = {}) => {
  const method = options.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...(estado.token && { Authorization: `Bearer ${estado.token}` })
  };
  const body = options.body ? JSON.stringify(options.body) : null;
  const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      logout();
      showToast('Sesión expirada, inicie sesión nuevamente', 'error');
    }
    throw new Error(data.error || 'Error en la petición');
  }
  return data;
};

// --- Auth ---
const login = async (email, password) => {
  const data = await api('/auth/login', { method: 'POST', body: { email, password } });
  estado.token = data.token;
  estado.usuario = data.usuario;
  localStorage.setItem('dulce-token', data.token);
  localStorage.setItem('dulce-usuario', JSON.stringify(data.usuario));
  updateUI();
  connectSSE(); // Reconnect SSE after login
};

const register = async (nombre, email, password, telefono = '', direccion = '') => {
  const data = await api('/auth/registro', {
    method: 'POST',
    body: { nombre, email, password, telefono, direccion }
  });
  showToast('Registro exitoso, ya puede iniciar sesión', 'éxito');
};

const logout = () => {
  estado.token = null;
  estado.usuario = null;
  localStorage.removeItem('dulce-token');
  localStorage.removeItem('dulce-usuario');
  localStorage.removeItem('dulce-carrito');
  estado.carrito = [];
  updateUI();
  if (estado.sseSource) { estado.sseSource.close(); estado.sseSource = null; }
  showToast('Sesión cerrada', 'info');
  window.location.hash = '#/';
};

// --- Carrito ---
const cargarCarrito = () => {
  const ls = localStorage.getItem('dulce-carrito');
  if (ls) estado.carrito = JSON.parse(ls);
  actualizarCarritoDOM();
};

const actualizarCarritoDOM = () => {
  const itemsConProducto = estado.carrito.map((i) => ({
    ...i,
    prod: productData.find((p) => p.slug === i.slug)
  })).filter((i) => i.prod);

  if (itemsConProducto.length === 0) {
    $('#app').innerHTML = `
      <section class="seccion" style="min-height:60vh;display:flex;align-items:center;justify-content:center;">
        <div class="carrito-vacio">
          <div class="carrito-vacio-icono" style="display:flex;align-items:center;justify-content:center;">${frascoSvg('fresa', 56)}</div>
          <h2>Tu carrito está vacío</h2>
          <p>Explora nuestros sabores artesanales y añadí tus favoritos.</p>
          <div class="carrito-empty-acciones">
            <a href="#/catalogo" class="cta-btn" style="text-decoration:none;">Explorar catálogo</a>
            <a href="#/inicio" class="btn btn-outline dark" style="text-decoration:none;">Volver al inicio</a>
          </div>
        </div>
      </section>`;
    return;
  }

  const cfg = estado.config || {};
  const subtotal = itemsConProducto.reduce((acc, i) => acc + i.prod.precio * i.cantidad, 0);
  const costoEnvio = cfg.costo_envio ?? 1.5;
  const gratisDesde = cfg.envio_gratis_desde ?? 15;
  const envio = subtotal >= gratisDesde ? 0 : costoEnvio;
  const total = red2(subtotal + envio);
  const faltaGratis = envio > 0 ? fmtDinero(gratisDesde - subtotal) : null;
  const totalItems = itemsConProducto.reduce((acc, i) => acc + i.cantidad, 0);

  $('#app').innerHTML = `
    <section class="seccion" style="max-width:800px;">
      <div class="carrito-header">
        <h2 class="section-title" style="margin:0;">Tu carrito</h2>
        <span class="carrito-contador">${totalItems} producto${totalItems !== 1 ? 's' : ''}</span>
      </div>
      <div id="carrito-lista">
        ${itemsConProducto.map(({ slug, cantidad, prod }) => {
          const idxReal = estado.carrito.indexOf(estado.carrito.find((i2) => i2.slug === slug));
          return `
          <div class="carrito-item">
            <div class="carrito-item-img">
              ${frascoSvg(getSvgKey(prod.imagen), 44)}
            </div>
            <div class="carrito-item-info">
              <a href="#/producto/${slug}" class="carrito-item-nombre">${esc(prod.nombre)}</a>
              <div class="carrito-item-precio-unit">${fmtDinero(prod.precio)} c/u</div>
              <div class="cantidad-selector" style="margin:6px 0 0;transform:scale(.85);transform-origin:left;">
                <button type="button" data-accion="menos" data-slug="${slug}" aria-label="Reducir cantidad">−</button>
                <span class="cantidad-input" style="min-width:44px;text-align:center;">${cantidad}</span>
                <button type="button" data-accion="mas" data-slug="${slug}" aria-label="Aumentar cantidad">+</button>
              </div>
            </div>
            <div class="carrito-item-total">${fmtDinero(prod.precio * cantidad)}</div>
            <button class="quitar-item" data-index="${idxReal}" aria-label="Quitar producto">×</button>
          </div>`;
        }).join('')}
      </div>

      ${faltaGratis ? `<div class="carrito-envio-bar">
        🚚 Te faltan <strong style="margin:0 4px;">${faltaGratis}</strong> para envío GRATIS
      </div>` : `<div class="carrito-envio-bar" style="background:#e8f5e9;color:#2e7d32;">
        🎉 ¡Envío GRATIS en tu pedido!
      </div>`}

      <div class="checkout-resumen">
        <div class="fila"><span>Subtotal</span><span>${fmtDinero(subtotal)}</span></div>
        <div class="fila"><span>Envío</span><span>${envio === 0 ? 'GRATIS 🎉' : fmtDinero(envio)}</span></div>
        <div class="fila total"><span>Total (sin IVA)</span><span>${fmtDinero(total)}</span></div>
        <button id="btn-finalizar" class="btn btn-primary btn-finalizar" style="margin-top:16px;width:100%;padding:16px;font-size:1rem;">
          Finalizar compra →
        </button>
        <button id="btn-vaciar" class="btn btn-outline dark" style="margin-top:10px;width:100%;padding:10px;">Vaciar carrito</button>
      </div>
    </section>`;

  document.querySelectorAll('[data-accion]').forEach((b) => {
    b.addEventListener('click', () => {
      const item = estado.carrito.find((i) => i.slug === b.dataset.slug);
      if (!item) return;
      const prod = productData.find((p) => p.slug === b.dataset.slug);
      if (b.dataset.accion === 'mas') item.cantidad = Math.min(item.cantidad + 1, prod?.stock || 99);
      else item.cantidad = Math.max(1, item.cantidad - 1);
      localStorage.setItem('dulce-carrito', JSON.stringify(estado.carrito));
      actualizarCarritoDOM();
    });
  });

  document.querySelectorAll('.quitar-item').forEach((b) => {
    b.addEventListener('click', () => {
      quitarDelCarrito(Number(b.dataset.index));
    });
  });

  $('#btn-vaciar')?.addEventListener('click', () => {
    estado.carrito = [];
    localStorage.removeItem('dulce-carrito');
    actualizarCarritoDOM();
  });

  $('#btn-finalizar')?.addEventListener('click', () => {
    window.location.hash = '#/checkout';
  });
};

const agregarAlCarrito = (productoSlug, cantidad = 1, evt) => {
  const existente = estado.carrito.find(i => i.slug === productoSlug);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    estado.carrito.push({ slug: productoSlug, cantidad });
  }
  localStorage.setItem('dulce-carrito', JSON.stringify(estado.carrito));
  showToast('Producto añadido al carrito', 'éxito');
  // Fly to cart animation
  flyToCartAnimation(evt);
  actualizarCarritoDOM();
};

const quitarDelCarrito = (idx) => {
  estado.carrito.splice(idx, 1);
  localStorage.setItem('dulce-carrito', JSON.stringify(estado.carrito));
  actualizarCarritoDOM();
};

const flyToCartAnimation = (evt) => {
  const cartIcon = document.querySelector('.cart-badge');
  if (!cartIcon) return;
  const btn = evt && evt.target ? evt.target.closest('.btn-agregar') : null;
  if (!btn) return;
  const rectBtn = btn.getBoundingClientRect();
  const rectCart = cartIcon.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.left = `${rectBtn.left}px`;
  overlay.style.top = `${rectBtn.top}px`;
  overlay.style.width = `${rectBtn.width}px`;
  overlay.style.height = `${rectBtn.height}px`;
  overlay.style.background = '#FFB3BA';
  overlay.style.borderRadius = '50%';
  overlay.style.transition = 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
  overlay.style.pointerEvents = 'none';
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.style.width = '0px';
    overlay.style.height = '0px';
    overlay.style.left = `${rectCart.left}px`;
    overlay.style.top = `${rectCart.top}px`;
    overlay.style.opacity = '0';
  }, 10);
  setTimeout(() => overlay.remove(), 400);
};

// --- SSE (Server-Sent Events) ---
const connectSSE = () => {
  // Limpiar conexiones previas
  estado.sseClientes.forEach(c => c.res.close());
  estado.sseClientes.clear();

  const source = new EventSource('/api/eventos');
  estado.sseClientes.add({ res: source });

  function actualizarStockEnDOM(productoId, nuevoStock) {
    const prod = productData.find((p) => p.id === productoId);
    if (prod) prod.stock = nuevoStock;
    document.querySelectorAll(`[data-pid="${productoId}"]`).forEach((el) => {
      const agotado = nuevoStock === 0;
      const bajo = !agotado && nuevoStock < (prod?.stock_minimo || 5);
      el.className = `badge-estado ${agotado ? 'badge-agotado' : bajo ? 'stock-alert' : 'badge-disponible'}`;
      el.textContent = agotado ? 'Agotado' : bajo ? `¡Últimas ${nuevoStock}!` : `${nuevoStock} disponibles`;
    });
  }

  source.addEventListener('stock', (e) => {
    const d = JSON.parse(e.data);
    actualizarStockEnDOM(d.producto_id, d.stock);
    if (d.bajoStock && d.stock <= 2) showToast(`Queda poco stock de ${d.producto_nombre}`, 'warning');
  });
  source.addEventListener('connected', () => {});

  source.onerror = () => {
    source.close();
    setTimeout(connectSSE, 5000); // Reintentar
  };
};

// --- Rutas (hash-based) ---
const routes = {
  '/': inicio,
  '/catalogo': catalogo,
  '/producto/:slug': productoFicha,
  '/carrito': carrito,
  '/checkout': checkout,
  '/pedido/:numero': pedidoConfirmacion,
  '/nosotros': nosotros,
  '/contacto': contacto,
  '/login': loginView,
  '/registro': registroView,
  '/admin': adminView
};

const router = () => {
  const hash = window.location.hash || '#/';
  const path = hash.replace(/^#/, '') || '/';

  let View = null;
  let param = null;

  if (routes[path]) {
    View = routes[path];
  } else {
    for (const [pattern, handler] of Object.entries(routes)) {
      if (!pattern.includes(':')) continue;
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
      const m = path.match(regex);
      if (m) { View = handler; param = m[1]; break; }
    }
  }

  const main = $('#app');
  if (main) main.innerHTML = '';

  if (View) {
    View(param);
    const titulos = {
      '/': 'Inicio', '/catalogo': 'Catálogo', '/carrito': 'Carrito',
      '/checkout': 'Finalizar compra', '/nosotros': 'Nosotros', '/contacto': 'Contacto',
      '/login': 'Iniciar sesión', '/registro': 'Registrarse', '/admin': 'Panel Admin'
    };
    document.title = `${titulos[path] || 'Producto'} | Dulce Encanto`;
  } else {
    $('#app').innerHTML = `<p style="color:var(--rosa-fuerte);">404 - Página no encontrada</p>`;
  }

  document.querySelectorAll('.nav-links a').forEach(a => {
    const aPath = (a.getAttribute('href') || '').replace(/^#/, '') || '/';
    a.classList.toggle('activo', aPath === path);
  });
};

// --- Inicialización de vistas ---

// Tarjeta de producto reutilizable
const tarjetaProducto = (p) => {
  const bajo = p.stock < p.stock_minimo;
  const agotado = p.stock === 0;
  return `
    <article class="card-producto reveal">
      ${p.destacado ? '<span class="destacado-star">★ Destacado</span>' : ''}
      <div class="card-media">${frascoSvg(getSvgKey(p.imagen), 60)}</div>
      <div class="card-body">
        <h3 class="nombre">${esc(p.nombre)}</h3>
        <p class="tagline">${esc(p.tagline || '')}</p>
        <div class="precio">${fmtDinero(p.precio)} <small>/ frasco</small></div>
        <span class="badge-estado ${agotado ? 'badge-agotado' : bajo ? 'stock-alert' : 'badge-disponible'}" data-pid="${p.id}">
          ${agotado ? 'Agotado' : bajo ? `¡Últimas ${p.stock}!` : `${p.stock} disponibles`}
        </span>
        ${esCatalogo()
          ? `<a href="#/contacto" class="btn-agregar" style="text-decoration:none;">Contáctenos</a>`
          : agotado
            ? `<button class="btn-agregar" disabled>Agotado</button>`
            : `<button class="btn-agregar" data-slug="${p.slug}">Añadir al carrito</button>`}
      </div>
    </article>`;
};

const inicio = () => {
  const frascosFlotantes = [
    frascoSvg('fresa', 60), frascoSvg('mora', 52),
    frascoSvg('durazno', 48), frascoSvg('mango', 56),
    frascoSvg('guayaba', 44), frascoSvg('mixta', 50)
  ].map((svg, i) => `<div class="hero-floating" style="top:${[12,22,50,40,60,30][i]}%;${i%2===0?'left':'right'}:${[6,5,2,8,4,3][i]}%;">${svg}</div>`).join('');

  $('#app').innerHTML = `
    <section class="hero">
      ${frascosFlotantes}
      <div class="hero-content">
        <span class="hero-badge">🍓 Hecho a mano · Lotes pequeños</span>
        <h1>Dulce Encanto</h1>
        <p class="hero-sub">Una explosión de sabor natural en cada cucharada.
        Mermeladas artesanales hechas con fruta fresca de temporada.</p>
        <div class="hero-actions">
          <a href="#/catalogo" class="cta-btn">Explorar sabores</a>
          <a href="#/nosotros" class="btn-outline dark">Nuestra historia</a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="hero-stat-num">6+</div><div class="hero-stat-label">Sabores</div></div>
          <div class="hero-stat"><div class="hero-stat-num">100%</div><div class="hero-stat-label">Natural</div></div>
          <div class="hero-stat"><div class="hero-stat-num">♥</div><div class="hero-stat-label">Hecho a mano</div></div>
        </div>
      </div>
    </section>

    <section class="seccion" id="destacados">
      <div class="section-head reveal">
        <div class="section-visual">${frascoSvg('fresa', 80)}</div>
        <span class="section-kicker">Los favoritos</span>
        <h2 class="section-title">Mermeladas Destacadas</h2>
        <p class="section-sub">Las que nuestros clientes vuelven a comprar una y otra vez.</p>
      </div>
      <div id="destacados-grid" style="display:grid;gap:26px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));"></div>
      <div style="text-align:center;margin-top:36px;" class="reveal">
        <a href="#/catalogo" class="btn btn-outline dark">Ver todo el catálogo →</a>
      </div>
    </section>

    <section class="seccion alt-bg">
      <div class="section-head reveal">
        <span class="section-kicker">Nuestro compromiso</span>
        <h2 class="section-title">Natural, artesanal, real</h2>
      </div>
      <div class="valores reveal">
        <div class="valor-card">
          <div class="valor-icono">${frutaSvg('fresa', 36)}</div>
          <div class="valor-titulo">Fruta fresca</div>
          <p class="valor-desc">De temporada y en su punto exacto. Seleccionamos cada pieza a mano.</p>
        </div>
        <div class="valor-card">
          <div class="valor-icono">${frascoSvg('mora', 34)}</div>
          <div class="valor-titulo">Cocción lenta</div>
          <p class="valor-desc">Pequeños lotes artesanales. Sin prisa, con dedicación.</p>
        </div>
        <div class="valor-card">
          <div class="valor-icono">${frutaSvg('durazno', 36)}</div>
          <div class="valor-titulo">Sin conservantes</div>
          <p class="valor-desc">Solo azúcar de caña y limón natural. Nada artificial.</p>
        </div>
        <div class="valor-card">
          <div class="valor-icono">${corazonSvg(34)}</div>
          <div class="valor-titulo">Hecho a mano</div>
          <p class="valor-desc">Etiquetado y decorado uno a uno, con amor.</p>
        </div>
      </div>
    </section>

    <section class="seccion">
      <div class="section-head reveal">
        <div class="section-visual">${corazonSvg(48)}</div>
        <span class="section-kicker">Lo que dicen</span>
        <h2 class="section-title">Nuestros clientes</h2>
      </div>
      <div class="testimonios-grid reveal">
        <div class="testimonio-card">
          <p class="testimonio-texto">"La mejor mermelada que he probado. Se nota que es hecha con amor y fruta de verdad."</p>
          <div class="testimonio-autor">
            <div class="testimonio-avatar">MC</div>
            <div><div class="testimonio-nombre">María C.</div><div class="testimonio-rol">Cliente frecuente</div></div>
          </div>
        </div>
        <div class="testimonio-card">
          <p class="testimonio-texto">"Regalé frascos en Navidad y todos preguntaron dónde los compré. ¡Éxito total!"</p>
          <div class="testimonio-autor">
            <div class="testimonio-avatar">AL</div>
            <div><div class="testimonio-nombre">Ana L.</div><div class="testimonio-rol">Compra recurrente</div></div>
          </div>
        </div>
        <div class="testimonio-card">
          <p class="testimonio-texto">"El sabor a fruta natural es incomparable. Mi familia ya no quiere otra marca."</p>
          <div class="testimonio-autor">
            <div class="testimonio-avatar">JR</div>
            <div><div class="testimonio-nombre">Carlos R.</div><div class="testimonio-rol">Cliente desde 2024</div></div>
          </div>
        </div>
      </div>
    </section>
  `;

  const obs = new IntersectionObserver((ents) => ents.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('reveal-visible'); obs.unobserve(en.target); }
  }), { threshold:.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  const grid = $('#destacados-grid');
  if (grid) {
    grid.innerHTML = productData.slice(0, 3).map((p) => tarjetaProducto(p)).join('');
    grid.querySelectorAll('.btn-agregar[data-slug]').forEach(btn =>
      btn.addEventListener('click', (e) => agregarAlCarrito(btn.getAttribute('data-slug'), 1, e)));
  }
};

const catalogo = () => {
  $('#app').innerHTML = `
    <section class="seccion alt-bg" style="min-height:70vh;">
      <div class="section-head">
        <div class="section-visual">${frascoSvg('mixta', 80)}</div>
        <span class="section-kicker">Catálogo completo</span>
        <h2 class="section-title">Nuestros Sabores</h2>
        <p class="section-sub">${productData.length} mermeladas artesanales disponibles</p>
      </div>
      <div class="catalogo-toolbar">
        <div class="catalogo-search">
          <input type="text" id="catalogo-buscar" placeholder="Buscar por nombre, sabor o ingrediente..." aria-label="Buscar productos">
        </div>
        <span class="catalogo-count" id="catalogo-count">${productData.length} productos</span>
      </div>
      <div id="catalogo-grid" style="display:grid;gap:26px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));"></div>
      <div id="catalogo-vacio" style="display:none;text-align:center;padding:60px 20px;color:var(--tinta-suave);">
        <div class="section-visual" style="margin-bottom:16px;">${frascoSvg('fresa', 70)}</div>
        <h3 style="color:var(--plum);margin:0 0 8px;">No encontramos resultados</h3>
        <p>Intenta con otro término de búsqueda.</p>
      </div>
    </section>
  `;

  const grid = $('#catalogo-grid');
  const vacio = $('#catalogo-vacio');
  const countEl = $('#catalogo-count');
  const buscar = $('#catalogo-buscar');

  const renderProductos = (lista) => {
    if (lista.length === 0) {
      grid.style.display = 'none';
      vacio.style.display = 'block';
    } else {
      grid.style.display = '';
      vacio.style.display = 'none';
    }
    grid.innerHTML = lista.map((p) => tarjetaProducto(p)).join('');
    countEl.textContent = `${lista.length} producto${lista.length !== 1 ? 's' : ''}`;
    grid.querySelectorAll('.btn-agregar[data-slug]').forEach(btn =>
      btn.addEventListener('click', (e) => agregarAlCarrito(btn.getAttribute('data-slug'), 1, e)));
  };

  renderProductos(productData);

  buscar?.addEventListener('input', () => {
    const q = buscar.value.toLowerCase().trim();
    if (!q) return renderProductos(productData);
    const filtrados = productData.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.tagline || '').toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q) ||
      (p.ingredientes || '').toLowerCase().includes(q)
    );
    renderProductos(filtrados);
  });
};

const productoFicha = (param) => {
  const producto = productData.find(p => p.slug === param);
  if (!producto) return showToast('Producto no encontrado', 'error');

  const agotado = producto.stock === 0;
  const bajo = !agotado && producto.stock < producto.stock_minimo;

  $('#app').innerHTML = `
    <section class="seccion">
      <a href="#/catalogo" class="volver">← Volver al catálogo</a>
      <div class="producto-ficha">
        <div class="imagen-principal">${frascoSvg(getSvgKey(producto.imagen), 80)}</div>
        <div>
          ${producto.destacado ? '<span class="destacado-star">★ Destacado</span>' : ''}
          <h1 style="font-size:2rem;color:var(--plum);margin:10px 0 6px;">${esc(producto.nombre)}</h1>
          <p class="tagline" style="font-size:1.02rem;">${esc(producto.tagline || '')}</p>
          <div class="precio" style="font-size:1.7rem;">${fmtDinero(producto.precio)} <small>por frasco</small></div>

          <div class="${agotado ? 'badge-agotado' : bajo ? 'stock-alert' : 'badge-disponible'}"
               style="display:inline-flex;padding:5px 14px;border-radius:9999px;margin:12px 0;font-weight:700;"
               data-pid="${producto.id}">
            ${agotado ? 'Agotado temporalmente' : `Stock: ${producto.stock} unidades`}
          </div>

          <p style="color:var(--tinta-suave);">${esc(producto.descripcion || producto.tagline || '')}</p>
          <strong style="font-size:.85rem;color:var(--plum);">Ingredientes</strong>
          <ul class="ingredientes" style="margin:8px 0 4px;">
            ${(producto.ingredientes || 'Fruta, azúcar de caña, limón').split(',').map(i => `<li>${esc(i.trim())}</li>`).join('')}
          </ul>

          ${esCatalogo() ? '' : `
          <div class="cantidad-selector">
            <button type="button" id="restar">−</button>
            <input type="number" id="cantidad-input" min="1" max="${producto.stock || 1}" value="1" class="cantidad-input">
            <button type="button" id="sumar">+</button>
          </div>`}

          ${esCatalogo()
            ? '<a href="#/contacto" class="btn cta-btn" style="text-decoration:none;">Solicitar por contacto</a>'
            : `<button class="btn btn-primary btn-agregar-carrito" data-slug="${producto.slug}" style="width:100%;padding:15px;" ${agotado ? 'disabled' : ''}>
                 ${agotado ? 'Agotado' : 'Añadir al carrito'}
               </button>`}
        </div>
      </div>
    </section>
    <nav style="text-align:center;padding-bottom:40px;">
      <a href="#/catalogo" class="volver">← Seguir explorando sabores</a>
    </nav>
  `;

  const inputCantidad = $('#cantidad-input');
  const restar = $('#restar'), sumar = $('#sumar');
  if (restar && inputCantidad) restar.addEventListener('click', () => {
    inputCantidad.value = Math.max(1, (parseInt(inputCantidad.value) || 1) - 1);
  });
  if (sumar && inputCantidad) sumar.addEventListener('click', () => {
    inputCantidad.value = Math.min(producto.stock || 99, (parseInt(inputCantidad.value) || 1) + 1);
  });

  const btnAgregar = $(`.btn-agregar-carrito[data-slug="${producto.slug}"]`);
  if (btnAgregar && inputCantidad) {
    btnAgregar.addEventListener('click', () => {
      const qty = parseInt(inputCantidad.value) || 1;
      if (producto.stock < qty) {
        showToast(`Solo quedan ${producto.stock} unidades`, 'warning');
        return;
      }
      agregarAlCarrito(producto.slug, qty, null);
      showToast(`${qty} × ${producto.nombre} en tu carrito 🛒`, 'success');
    });
  }
};

const carrito = () => {
  cargarCarrito();
};

const checkout = () => {
  if (esCatalogo()) {
    showToast('Modo catálogo: compras por teléfono o contacto directo', 'info');
    return history.back();
  }
  if (estado.carrito.length === 0) {
    showToast('El carrito está vacío', 'warning');
    return history.back();
  }

  const subtotal = estado.carrito.reduce((s, i) => {
    const p = productData.find(p => p.slug === i.slug);
    return s + p.precio * i.cantidad;
  }, 0);
  const cfg = estado.config || {};
  const descuento = cuponActivo ? cuponActivo.descuento : 0;
  const impuesto = red2((subtotal - descuento) * (cfg.iva ?? 0.15));
  const envio = (subtotal - descuento) >= (cfg.envio_gratis_desde ?? 15) ? 0 : (cfg.costo_envio ?? 1.5);
  const total = Math.max(0, red2(subtotal - descuento + impuesto + envio));

  $('#app').innerHTML = `
    <section class="seccion checkout">
      <h2>Finalizar Compra</h2>
      <form class="checkout-form" id="checkout-form">
        <div class="form-group">
          <label>Cupón de descuento</label>
          <div style="display:flex;gap:8px;">
            <input type="text" id="cupon-input" placeholder="Ej. WELCOME10" style="flex:1;text-transform:uppercase;">
            <button type="button" id="btn-cupon" class="btn btn-outline" style="padding:8px 14px;">Aplicar</button>
          </div>
          <small id="cupon-feedback" style="color:#1a9850;"></small>
        </div>
        <div class="form-group">
          <label for="checkout-nombre">Nombre completo</label>
          <input type="text" id="checkout-nombre" name="nombre" required>
        </div>
        <div class="form-group">
          <label for="checkout-telefono">Teléfono</label>
          <input type="tel" id="checkout-telefono" name="telefono" required>
        </div>
        <div class="form-group">
          <label for="checkout-direccion">Dirección de entrega</label>
          <textarea id="checkout-direccion" name="direccion" required></textarea>
        </div>
        <div class="form-group">
          <label>Método de pago</label>
          <div class="payment-methods">
            <label><input type="radio" name="metodo_pago" value="transferencia_bancaria"> Transferencia bancaria</label>
            <label><input type="radio" name="metodo_pago" value="efectivo"> Efectivo contra entrega</label>
            <label><input type="radio" name="metodo_pago" value="tarjeta"> Tarjeta de crédito/débito</label>
          </div>
        </div>
        <div class="form-group">
          <label>Notas adicionales</label>
          <textarea></textarea>
        </div>
        <div style="margin-top:24px;">
          <div class="fila"><span>Subtotal</span>${fmtDinero(subtotal)}</div>
          ${descuento > 0 ? `<div class="fila" style="color:#1a9850;"><span>Cupón ${cuponActivo.codigo}</span>−${fmtDinero(descuento)}</div>` : ''}
          <div class="fila"><span>IVA</span>${fmtDinero(impuesto)}</div>
          <div class="fila"><span>Envío</span>${fmtDinero(envio)}</div>
          <div class="total" style="font-weight:700;font-size:18px;color:var(--morado-profundo);">Total: ${fmtDinero(total)}</div>
        </div>
        <button type="submit" class="btn-finalizar">Finalizar Pedido</button>
      </form>
    </section>
    <nav class="nav-links" style="margin-top:20px;justify-content:center;">
      <a href="#/catalogo">← Volver al catálogo</a>
    </nav>
  `;

  const btnCupon = $('#btn-cupon');
  if (btnCupon) {
    btnCupon.addEventListener('click', async () => {
      const codigo = $('#cupon-input').value.trim();
      const feedback = $('#cupon-feedback');
      if (!codigo) return;
      try {
        const subtotal = estado.carrito.reduce((acc, i) => {
          const p = productData.find(p => p.slug === i.slug);
          return acc + (p ? p.precio * i.cantidad : 0);
        }, 0);
        const r = await api('/cupones/validar', { method: 'POST', body: { codigo, subtotal } });
        cuponActivo = { codigo: r.codigo, descuento: r.descuento };
        feedback.style.color = '#1a9850';
        feedback.textContent = `✓ Cupón aplicado: −${fmtDinero(r.descuento)}`;
        checkout(); // re-render con descuento
      } catch (e) {
        cuponActivo = null;
        feedback.style.color = '#e53e3e';
        feedback.textContent = e.message;
      }
    });
  }

  document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('checkout-nombre').value;
    const telefono = document.getElementById('checkout-telefono').value;
    const direccion = document.getElementById('checkout-direccion').value;
    const metodo_pago = document.querySelector('input[name="metodo_pago"]:checked')?.value || 'efectivo';

    try {
      const res = await api('/pedidos', {
        method: 'POST',
        body: {
          cliente_nombre: nombre,
          cliente_email: estado.usuario?.email || '',
          cliente_telefono: telefono,
          cliente_direccion: direccion,
          metodo_pago,
          cupon_codigo: cuponActivo?.codigo || '',
          items: estado.carrito.map(i => ({ producto_id: productData.find(p => p.slug === i.slug).id, cantidad: i.cantidad })),
          notas: $('#checkout-form').querySelector('textarea')?.value || ''
        }
      });

      // Guardar número de pedido
      localStorage.setItem('ultimo-pedido', res.numero);
      localStorage.setItem('dulce-ultimo-email', res.cliente_email || '');

      estado.carrito = [];
      cuponActivo = null;
      localStorage.removeItem('dulce-carrito');
      actualizarCarritoDOM();

      // Navegar a confirmación
      window.location.hash = `#/pedido/${res.numero}`;
    } catch (err) {
      showToast(err.message || 'Error al procesar el pedido', 'error');
    }
  });
};

const pedidoConfirmacion = (param) => {
  const numero = param;
  const pedido = { numero }; // En producción traería datos completos del servidor

  $('#app').innerHTML = `
    <section style="padding:60px 24px;max-width:600px;margin:0 auto;text-align:center;">
      <div style="width:80px;height:80px;margin:0 auto 24px;background:linear-gradient(135deg,#ffe3e6,#fdcfe8);border-radius:50%;display:flex;align-items:center;justify-content:center;">
        🍓
      </div>
      <h2>¡Gracias por tu pedido!</h2>
      <p>Tu orden <strong>${numero}</strong> ha sido recibida y nuestra cocina ya la está preparando.</p>
      <p>Pronto coordinaremos la entrega al teléfono que nos hayas proporcionado.</p>
      <button onclick="window.location.hash='#/catalogo'" style="margin-top:24px;padding:12px 24px;background:var(--rosa-fuerte);color:#fff;border:none;border-radius:10px;font-weight:600;">Continuar comprando</button>
    </section>
    <nav class="nav-links" style="margin-top:30px;justify-content:center;">
      <a href="#/catalogo">Volver a catálogo</a>
    </nav>
  `;
};

const nosotros = () => {
  $('#app').innerHTML = `
    <section class="seccion">
      <div class="nosotros-hero">
        <div class="nosotros-hero-deco">${frascoSvg('fresa', 160)}</div>
        <div class="nosotros-hero-inner">
          <h2>Hecho a mano, con el corazón</h2>
          <p>Conocé la historia detrás de cada frasco de Dulce Encanto.</p>
        </div>
      </div>

      <div class="nosotros-timeline reveal">
        <div class="timeline-item">
          <h3>El inicio</h3>
          <p>Nacimos del amor por las mermeladas artesanales y las ganas de compartir la fruta fresca de nuestra tierra.</p>
        </div>
        <div class="timeline-item">
          <h3>La receta</h3>
          <p>Cada frasco es horas de selección cuidadosa, cocción lenta en olla de hierro y un toque de limón que realza el sabor natural.</p>
        </div>
        <div class="timeline-item">
          <h3>El compromiso</h3>
          <p>Sin conservantes artificiales. Solo fruta, azúcar de caña y limón. Ingredientes reales para un sabor real.</p>
        </div>
        <div class="timeline-item">
          <h3>El toque final</h3>
          <p>Cada frasco se etiqueta y decora a mano, uno por uno, con la dedicación de quien sabe que cada detalle cuenta.</p>
        </div>
      </div>

      <div class="valores reveal" style="margin-top:48px;">
        <div class="valor-card">
          <div class="valor-icono">${frutaSvg('fresa', 34)}</div>
          <div class="valor-titulo">Filosofía</div>
          <p class="valor-desc">Fruta fresca de temporada. Sin conservantes. Cocción lenta en olla de hierro.</p>
        </div>
        <div class="valor-card">
          <div class="valor-icono">${frascoSvg('durazno', 34)}</div>
          <div class="valor-titulo">Compromiso</div>
          <p class="valor-desc">Fruta en su punto exacto, pequeños lotes, azúcar de caña y limón natural.</p>
        </div>
        <div class="valor-card">
          <div class="valor-icono">${corazonSvg(34)}</div>
          <div class="valor-titulo">El toque</div>
          <p class="valor-desc">Cada frasco se etiqueta y decora a mano, uno por uno, con amor.</p>
        </div>
      </div>

      <div class="nosotros-quote reveal">
        <p>"Una explosión de sabor natural en cada cucharada."</p>
      </div>

      <div class="valores reveal" style="margin-top:48px;">
        <div class="valor-card">
          <div class="valor-icono" style="background:#FFF3E0;color:#E65100;">📍</div>
          <div class="valor-titulo">Ubicación</div>
          <p class="valor-desc">Av. de las Flores 123, Quito, Ecuador</p>
        </div>
        <div class="valor-card">
          <div class="valor-icono" style="background:#E8F5E9;color:#2E7D32;">📞</div>
          <div class="valor-titulo">Contacto</div>
          <p class="valor-desc">+593 99 123 4567</p>
        </div>
        <div class="valor-card">
          <div class="valor-icono" style="background:#E3F2FD;color:#1565C0;">✉️</div>
          <div class="valor-titulo">Email</div>
          <p class="valor-desc">pedidos@dulceencanto.com</p>
        </div>
      </div>
    </section>
  `;

  const obs = new IntersectionObserver((ents) => ents.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('reveal-visible'); obs.unobserve(en.target); }
  }), { threshold:.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
};

const contacto = () => {
  $('#app').innerHTML = `
    <section class="seccion">
      <div class="contacto-hero">
        <div class="nosotros-hero-deco">${frascoSvg('guayaba', 140)}</div>
        <div class="nosotros-hero-inner">
          <h2>Hablemos</h2>
          <p>¿Tenés una pregunta, un pedido especial o simplemente querés saludar? Escribinos.</p>
        </div>
      </div>

      <div class="contacto-grid">
        <div class="contacto-form-card">
          <div style="text-align:center;margin-bottom:20px;">${frascoSvg('fresa', 48)}</div>
          <h3>Envíanos un mensaje</h3>
          <form id="contacto-form">
            <div class="form-group">
              <label for="contacto-nombre">Nombre</label>
              <input type="text" id="contacto-nombre" name="nombre" placeholder="Tu nombre" required>
            </div>
            <div class="form-group">
              <label for="contacto-email">Email</label>
              <input type="email" id="contacto-email" name="email" placeholder="tu@email.com" required>
            </div>
            <div class="form-group">
              <label for="contacto-asunto">Asunto</label>
              <input type="text" id="contacto-asunto" name="asunto" placeholder="¿En qué te podemos ayudar?" required>
            </div>
            <div class="form-group">
              <label for="contacto-mensaje">Mensaje</label>
              <textarea id="contacto-mensaje" name="mensaje" rows="4" placeholder="Escribí tu mensaje aquí..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;padding:14px;">Enviar mensaje</button>
          </form>
        </div>

        <div class="contacto-info-cards">
          <div class="contacto-info-card">
            <div class="contacto-info-icono" style="background:#FFF3E0;color:#E65100;">📍</div>
            <div class="contacto-info-texto">
              <strong>Dirección</strong>
              <span>Av. de las Flores 123, Quito</span>
            </div>
          </div>
          <div class="contacto-info-card">
            <div class="contacto-info-icono" style="background:#E8F5E9;color:#2E7D32;">📞</div>
            <div class="contacto-info-texto">
              <strong>Teléfono / WhatsApp</strong>
              <span>+593 99 123 4567</span>
            </div>
          </div>
          <div class="contacto-info-card">
            <div class="contacto-info-icono" style="background:#E3F2FD;color:#1565C0;">✉️</div>
            <div class="contacto-info-texto">
              <strong>Email</strong>
              <span>pedidos@dulceencanto.com</span>
            </div>
          </div>
          <div class="contacto-info-card">
            <div class="contacto-info-icono" style="background:#FCE4EC;color:#C62828;">🕐</div>
            <div class="contacto-info-texto">
              <strong>Horario</strong>
              <span>Lun - Vie: 8:00 - 18:00</span>
            </div>
          </div>
          <div class="contacto-info-card" style="justify-content:center;flex-direction:column;text-align:center;padding:24px;">
            <div style="margin-bottom:12px;">${frascoSvg('mixta', 64)}</div>
            <div style="font-size:.85rem;color:var(--tinta-suave);">Seguinos en redes sociales</div>
          </div>
        </div>
      </div>

      <div class="social-links">
        <a href="#" class="social-link">📘 Facebook</a>
        <a href="#" class="social-link">📷 Instagram</a>
        <a href="#" class="social-link">🎬 TikTok</a>
        <a href="#" class="social-link">💬 WhatsApp</a>
      </div>
    </section>
  `;

  document.getElementById('contacto-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('¡Mensaje enviado! Te responderemos pronto.', 'éxito');
    e.target.reset();
  });
};

const loginView = () => {
  $('#app').innerHTML = `
    <section class="seccion" style="max-width:400px;margin:0 auto;">
      <h2>Iniciar Sesión</h2>
      <form id="login-form">
        <div class="form-group">
          <label for="login-email">Email</label>
          <input type="email" id="login-email" name="email" required>
        </div>
        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <input type="password" id="login-password" name="password" required>
        </div>
        <button type="submit" class="btn-finalizar" style="width:100%;margin-top:16px;">Ingresar</button>
      </form>
      <p style="text-align:center;margin-top:20px;">
        ¿No tienes cuenta? <a href="#/registro">Regístrate aquí</a>
      </p>
    </section>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      await login(email, password);
      showToast('¡Bienvenido de nuevo!', 'success');
      window.location.hash = '#/';
    } catch (err) {
      showToast(err.message || 'No se pudo iniciar sesión', 'error');
    }
  });
};

const registroView = () => {
  $('#app').innerHTML = `
    <section class="seccion" style="max-width:400px;margin:0 auto;">
      <h2>Regístrate</h2>
      <form id="registro-form">
        <div class="form-group">
          <label for="registro-nombre">Nombre completo</label>
          <input type="text" id="registro-nombre" name="nombre" required>
        </div>
        <div class="form-group">
          <label for="registro-email">Email</label>
          <input type="email" id="registro-email" name="email" required>
        </div>
        <div class="form-group">
          <label for="registro-password">Contraseña</label>
          <input type="password" id="registro-password" name="password" required minlength="6">
        </div>
        <button type="submit" class="btn-finalizar" style="width:100%;margin-top:16px;">Crear cuenta</button>
      </form>
      <p style="text-align:center;margin-top:20px;">
        Ya tienes cuenta? <a href="#/login">Ingresa aquí</a>
      </p>
    </section>
  `;

  document.getElementById('registro-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('registro-nombre').value;
    const email = document.getElementById('registro-email').value;
    const password = document.getElementById('registro-password').value;
    try {
      await register(nombre, email, password);
      showToast('Cuenta creada ✅ Ya puedes iniciar sesión', 'success');
      window.location.hash = '#/login';
    } catch (err) {
      showToast(err.message || 'No se pudo crear la cuenta', 'error');
    }
  });
};

// --- Dashboard Admin ---
const adminView = async () => {
  if (!estado.usuario || estado.usuario.rol !== 'admin') {
    showToast('Acceso denegado - se requiere rol de administrador', 'error');
    window.location.hash = '#/';
    return;
  }

  $('#app').innerHTML = `
    <div class="admin-shell">
      <div class="admin-header">
        <div>
          <h2>Panel de Administración</h2>
          <p>Bienvenida, ${esc(estado.usuario.nombre)}</p>
        </div>
        <span class="user-chip">🛡️ Modo administrador</span>
      </div>

      <div class="kpi-grid" id="admin-kpis"></div>

      <div class="admin-grid-2">
        <div class="chart-card"><h3>Ventas últimos 14 días ($)</h3><div id="chart-ventas-dia" style="height:170px;"></div></div>
        <div class="chart-card"><h3>Top sabores (unidades)</h3><div id="chart-top-sabores" style="height:170px;"></div></div>
      </div>

      <div class="panel" id="admin-stock-bajo"></div>
      <div class="panel"><h3>Pedidos</h3><div id="admin-pedidos" style="overflow-x:auto;"></div></div>
      <div class="panel"><h3>Productos · ajuste de stock</h3><div id="admin-productos" style="overflow-x:auto;"></div></div>
    </div>
  `;

  try {
    const r = await api('/admin/resumen');
    const { kpis, ventas_por_dia, top_sabores, bajo_stock, ultimos_pedidos } = r;

    $('#admin-kpis').innerHTML = [
      [fmtDinero(kpis.ganancia_total), 'Ganancia total', `${kpis.unidades_vendidas} frascos vendidos`],
      [kpis.pedidos_totales, 'Pedidos totales', 'Histórico de ventas'],
      [kpis.unidades_vendidas, 'Frascos vendidos', 'Unidades totales'],
      [fmtDinero(kpis.ventas_totales), 'Facturación', 'Sin pedidos cancelados']
    ].map(([v, t2, sub]) => `
      <div class="kpi-card">
        <div class="kpi-valor">${v}</div>
        <div class="kpi-etiqueta">${t2}</div>
        <div class="kpi-sub">${sub}</div>
      </div>`).join('');

    graficoLineas('chart-ventas-dia',
      ventas_por_dia.map((d) => d.fecha.slice(5)),
      [{ valores: ventas_por_dia.map((d) => d.ventas) }]);
    graficoBarras('chart-top-sabores',
      top_sabores.map((t2) => ({ etiqueta: t2.nombre_producto.split(' ')[0], valor: t2.unidades })));

    const stockBox = $('#admin-stock-bajo');
    stockBox.innerHTML = bajo_stock.length === 0
      ? '<h3>Stock saludable ✅</h3>'
      : `<h3>Stock bajo ⚠️</h3>${bajo_stock.map((p2) =>
          `<div class="alerta-stock">⚠️ <strong>${esc(p2.nombre)}</strong> — quedan ${p2.stock} unidades (mínimo ${p2.stock_minimo})</div>`).join('')}`;

    cargarTablaPedidos();
    cargarTablaProductos();
  } catch (e) {
    showToast(e.message, 'error');
  }
};

async function cargarTablaPedidos() {
  const cont = $('#admin-pedidos');
  try {
    const pedidos = await api('/admin/pedidos');
    const estados = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
    if (!pedidos.length) {
      cont.innerHTML = '<p style="padding:16px;color:var(--tinta-suave);">Aún no hay pedidos.</p>';
      return;
    }
    cont.innerHTML = `<table class="tabla-admin">
      <thead><tr><th>Número</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
      <tbody>${pedidos.map((p2) => `
        <tr>
          <td><strong>${esc(p2.numero)}</strong></td>
          <td>${esc(p2.cliente_nombre)}</td>
          <td>${fmtDinero(p2.total)}</td>
          <td>
            <select class="estado-select pedido-estado" data-id="${p2.id}">
              ${estados.map((e2) => `<option ${e2 === p2.estado ? 'selected' : ''}>${e2}</option>`).join('')}
            </select>
          </td>
        </tr>`).join('')}</tbody></table>`;
    cont.querySelectorAll('.pedido-estado').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await api(`/admin/pedidos/${sel.dataset.id}/estado`, { method: 'PATCH', body: { estado: sel.value } });
          showToast(`Pedido ${sel.dataset.id} → ${sel.value}`, 'success');
        } catch (e) { showToast(e.message, 'error'); }
      });
    });
  } catch (e) {
    cont.innerHTML = `<p style="padding:16px;color:var(--error);">${esc(e.message)}</p>`;
  }
}

async function cargarTablaProductos() {
  const cont = $('#admin-productos');
  try {
    const productos = await api('/productos');
    cont.innerHTML = `<table class="tabla-admin">
      <thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Ajustar</th></tr></thead>
      <tbody>${productos.map((p2) => `
        <tr>
          <td><strong>${esc(p2.nombre)}</strong></td>
          <td>${fmtDinero(p2.precio)}</td>
          <td data-stock="${p2.id}">${p2.stock}</td>
          <td style="white-space:nowrap;">
            <button class="stock-btn" data-id="${p2.id}" data-delta="-1">−</button>
            <button class="stock-btn" data-id="${p2.id}" data-delta="1">+</button>
          </td>
        </tr>`).join('')}</tbody></table>`;
    cont.querySelectorAll('.stock-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const r = await api(`/admin/productos/${btn.dataset.id}/stock`, {
            method: 'PATCH',
            body: { delta: Number(btn.dataset.delta), referencia: 'ajuste manual panel' }
          });
          const celda = cont.querySelector(`[data-stock="${btn.dataset.id}"]`);
          if (celda) celda.textContent = r.stock;
          showToast('Stock actualizado', 'success');
        } catch (e) { showToast(e.message, 'error'); }
      });
    });
  } catch (e) {
    cont.innerHTML = `<p style="padding:16px;color:var(--error);">${esc(e.message)}</p>`;
  }
  if (window.initAdminCSV) window.initAdminCSV();
};





// --- Helpers varios ---
const red2 = (n) => Math.round(n * 100) / 100;

// PWA: registrar service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const abierto = navLinks.classList.toggle('abierto');
    hamburger.setAttribute('aria-expanded', abierto);
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('abierto');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// --- Inicio ---
const init = async () => {
  // Cargar carrito desde localStorage
  cargarCarrito();

  // Config de tienda (moneda, IVA, modo catálogo) y catálogo real del API
  try {
    const [cfg, prods] = await Promise.all([api('/config'), api('/productos')]);
    estado.config = cfg;
    productData = prods;
  } catch { /* sin API se muestran los datos por defecto */ }

  // Verificar token y usuario
  if (estado.token) {
    const payload = decodificarPayload(estado.token);
    if (payload && payload.rol === 'admin') {
      // Auto-login admin
      estado.usuario = { id: payload.id, rol: 'admin', nombre: 'Dueña Dulce Encanto' };
    } else {
      // Cliente login
      estado.usuario = { id: payload.id, rol: payload.rol, nombre: payload.nombre };
    }
  }

  // Actualizar UI
  updateUI();

  // Conectar SSE si hay usuario logueado
  connectSSE();

  // Router inicial
  router();
  window.addEventListener('hashchange', router);
};

const updateUI = () => {
  // Badge del carrito
  const badge = $('#cart-badge');
  if (badge) badge.textContent = estado.carrito.reduce((a, i) => a + i.cantidad, 0);

  // Menú de usuario
  const slot = $('#user-slot');
  if (!slot) return;
  slot.innerHTML = '';

  if (estado.usuario && estado.usuario.rol !== 'admin') {
    slot.innerHTML = `
      <div class="menu-usuario">
        <span class="user-chip">${esc(estado.usuario.nombre.split(' ')[0])} 👤</span>
        <button class="btn-logout" id="btn-logout" title="Cerrar sesión">Salir</button>
      </div>`;
    $('#btn-logout')?.addEventListener('click', () => logout());
  } else if (estado.usuario && estado.usuario.rol === 'admin') {
    slot.innerHTML = `
      <div class="menu-usuario">
        <span class="user-chip">🛡️ Admin</span>
        <button class="btn-logout" id="btn-logout" title="Cerrar sesión">Salir</button>
      </div>`;
    $('#btn-logout')?.addEventListener('click', () => logout());
  } else {
    const a = document.createElement('a');
    a.href = '#/login';
    a.className = 'nav-login';
    a.textContent = 'Iniciar sesión';
    slot.appendChild(a);
  }
};

// Verificar si estamos en la página admin para inicializar el dashboard
if (window.location.hash === '#/admin' || window.location.pathname.includes('/admin')) {
  adminView();
} else {
  init();
}

// Exportar funciones útiles
window.agregarAlCarrito = agregarAlCarrito;
window.quitarDelCarrito = quitarDelCarrito;
window.fmtDinero = fmtDinero;
window.showToast = showToast;