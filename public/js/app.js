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

// Decodifica el payload de un token firmado (solo lectura de UI)
const verificarToken = (token = '') => {
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
  SSE_CLIENTES.forEach(c => c.res.close());
  SSE_CLIENTES.clear();
};

// --- Carrito ---
const cargarCarrito = () => {
  const ls = localStorage.getItem('dulce-carrito');
  if (ls) estado.carrito = JSON.parse(ls);
  actualizarCarritoDOM();
};

const actualizarCarritoDOM = () => {
  const carrito = $('.carrito-con-items') || document.createElement('div');
  const itemsDiv = $('#carrito-items') || document.createElement('div');
  if (!$('#carrito-items')) {
    document.querySelector('#carrito-contenido')?.appendChild(itemsDiv);
  }
  if (estado.carrito.length === 0) {
    itemsDiv.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío</p>';
    $('#carrito-total')?.remove();
    return;
  }
  let total = 0;
  itemsDiv.innerHTML = estado.carrito.map((item, i) => {
    const prod = productData.find(p => p.slug === item.slug);
    const subtotal = prod.precio * item.cantidad;
    total += subtotal;
    return `<div class="carrito-item">
      <span>${prod.nombre} × ${item.cantidad}</span>
      <span>${fmtDinero(subtotal)}</span>
      <button class="quitar-item" data-index="${i}">×</button>
    </div>`;
  }).join('') + `<div class="carrito-resumen"><div class="fila"><span>Subtotal</span>${fmtDinero(total)}</div><div class="total">Total: ${fmtDinero(total)}</div></div>`;
  if (!$('#carrito-total')) {
    const resDiv = document.createElement('div');
    resDiv.id = 'carrito-total';
    resDiv.className = 'carrito-resumen';
    resDiv.innerHTML = `<div class="fila"><span>Subtotal</span>${fmtDinero(total)}</div><div class="total">Total: ${fmtDinero(total)}</div>`;
    document.querySelector('#carrito-contenido')?.appendChild(resDiv);
  };
};

const agregarAlCarrito = (productoSlug, cantidad = 1) => {
  const existente = estado.carrito.find(i => i.slug === productoSlug);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    estado.carrito.push({ slug: productoSlug, cantidad });
  }
  localStorage.setItem('dulce-carrito', JSON.stringify(estado.carrito));
  showToast('Producto añadido al carrito', 'éxito');
  // Fly to cart animation
  flyToCartAnimation();
  actualizarCarritoDOM();
};

const quitarDelCarrito = (idx) => {
  estado.carrito.splice(idx, 1);
  localStorage.setItem('dulce-carrito', JSON.stringify(estado.carrito));
  actualizarCarritoDOM();
};

const flyToCartAnimation = () => {
  const cartIcon = document.querySelector('.cart-badge');
  if (!cartIcon) return;
  const btn = event && event.target ? event.target.closest('.btn-agregar') : null;
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

  source.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.tipo === 'stock') {
      // Actualizar badge de stock en el catálogo
      const badge = document.querySelector(`[data-producto="${data.producto_id}"] .badge`);
      if (badge) {
        badge.textContent = data.bajoStock ? '¡Últimas!' : '';
        badge.className = data.bajoStock ? 'bajo' : '';
      }
      // Si está en bajo stock crítico, mostrar toast
      if (data.bajoStock && data.stock <= 2) {
        showToast(`Queda poco stock de ${data.producto_nombre}`, 'warning');
      }
    }
    if (data.tipo === 'pedido') {
      showToast(`Nuevo pedido ${data.numero}`, 'éxito');
    }
  };

  source.onerror = () => {
    source.close();
    setTimeout(connectSSE, 5000); // Reintentar
  };
};

// --- Rutas (hash-based) ---
const routes = {
  '#/': inicio,
  '#/catalogo': catalogo,
  '#/producto/:slug': productoFicha,
  '#/carrito': carrito,
  '#/checkout': checkout,
  '#/pedido/:numero': pedidoConfirmacion,
  '#/nosotros': nosotros,
  '#/contacto': contacto,
  '#/login': loginView,
  '#/registro': registroView,
  '#/admin': adminView
};

const router = () => {
  const hash = window.location.hash || '#/';
  const match = hash.match(/^#\/([^/]+)(?:\/(.+))?$/);
  const ruta = match ? match[1] : '';
  const param = match && match[2] ? match[2] : null;

  // Ocultar todas las vistas
  document.querySelectorAll('[data-vista]').forEach(el => el.classList.add('oculto'));

  // Ejecutar la vista correspondiente
  const View = routes[ruta];
  if (View) {
    // Remover oculto del contenedor principal
    const main = $('#app');
    if (main) main.innerHTML = ''; // Limpiar antes de renderizar
    View(param);
  } else {
    $('#app').innerHTML = `<p style="color:var(--rosa-fuerte);">404 - Página no encontrada</p>`;
  }

  // Actualizar navbar activo
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('activo', a.getAttribute('href') === hash);
  });
};

// --- Inicialización de vistas ---

const inicio = () => {
  $('#app').innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <span class="hero-badge">🍓 Hecho a mano · Lotes pequeños</span>
        <h1>Dulce Encanto</h1>
        <p class="hero-sub">Una explosión de sabor natural en cada cucharada.
        Mermeladas artesanales hechas con fruta fresca de temporada.</p>
        <div class="hero-actions">
          <a href="#/catalogo" class="cta-btn">Explorar sabores</a>
          <a href="#/nosotros" class="btn-outline">Nuestra historia</a>
        </div>
      </div>
    </section>

    <section class="seccion" id="destacados">
      <div class="section-head reveal">
        <span class="section-kicker">Los favoritos</span>
        <h2 class="section-title">Mermeladas Destacadas</h2>
        <p class="section-sub">Las que nuestros clientes vuelven a comprar una y otra vez.</p>
      </div>
      <div id="destacados-grid" style="display:grid;gap:26px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));"></div>
    </section>

    <section class="seccion alt-bg">
      <div class="section-head reveal">
        <span class="section-kicker">Nuestro compromiso</span>
        <h2 class="section-title">Natural, artesanal, real</h2>
      </div>
      <div class="valores reveal">
        <div class="valor-card"><div class="valor-emoji">🍓</div><div class="valor-titulo">Fruta fresca</div>De temporada y en su punto exacto.</div>
        <div class="valor-card"><div class="valor-emoji">🔥</div><div class="valor-titulo">Cocción lenta</div>Pequeños lotes artesanales.</div>
        <div class="valor-card"><div class="valor-emoji">🌿</div><div class="valor-titulo">Sin conservantes</div>Solo azúcar de caña y limón.</div>
        <div class="valor-card"><div class="valor-emoji">🎀</div><div class="valor-titulo">Hecho a mano</div>Etiquetado y decorado uno a uno.</div>
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
      btn.addEventListener('click', () => agregarAlCarrito(btn.getAttribute('data-slug')))
    );
  }
};;

const catalogo = () => {
  $('#app').innerHTML = `
    <section class="seccion alt-bg" style="min-height:70vh;">
      <div class="section-head">
        <span class="section-kicker">Catálogo completo</span>
        <h2 class="section-title">Nuestros Sabores</h2>
        <p class="section-sub">${productData.length} mermeladas artesanales disponibles</p>
      </div>
      <div id="catalogo-grid" style="display:grid;gap:26px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));"></div>
    </section>
  `;
  const grid = $('#catalogo-grid');
  if (grid) {
    grid.innerHTML = productData.map((p) => tarjetaProducto(p)).join('');
    grid.querySelectorAll('.btn-agregar[data-slug]').forEach(btn =>
      btn.addEventListener('click', () => agregarAlCarrito(btn.getAttribute('data-slug')))
    );
  }
};;

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
               style="display:inline-flex;padding:5px 14px;border-radius:9999px;margin:12px 0;font-weight:700;">
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
      agregarAlCarrito(producto.slug, qty);
      showToast(`${qty} × ${producto.nombre} en tu carrito 🛒`, 'success');
    });
  }
};;

const carrito = () => {
  cargarCarrito();
  $('#app').innerHTML = `
    <section class="seccion carrito-vacio" id="carrito-contenido">
      Tu carrito está vacío
    </section>
  `;
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
          <label>Nombre completo</label>
          <input type="text" required>
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <input type="tel" required>
        </div>
        <div class="form-group">
          <label>Dirección de entrega</label>
          <textarea required></textarea>
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
    const nombre = $('#checkout-form').querySelector('input[type="text"]').value;
    const telefono = $('#checkout-form').querySelector('input[type="tel"]').value;
    const direccion = $('#checkout-form').querySelector('textarea').value;
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

      // Limpiar carrito
      estado.carrito = [];
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
      <p style="margin:24px 0;color:var(--morado);">Ganancia estimada: $${(productData.reduce((s,p)=>s+p.cantidad*0.8,0)*0.80).toFixed(2)}</p>
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
      <div class="section-head">
        <span class="section-kicker">Nuestra historia</span>
        <h2 class="section-title">Hecho a mano, con el corazón</h2>
      </div>
      <div class="nosotros-contenido">
        <p>En Dulce Encanto nacimos del amor por las mermeladas artesanales y
        las ganas de compartir la fruta fresca de nuestra tierra. Cada frasco es
        horas de selección, cocción lenta y cuidado en cada cucharada.</p>
      </div>
      <div class="valores" style="margin-top:36px;">
        <div class="valor-card"><div class="valor-emoji">🍓</div><div class="valor-titulo">Filosofía</div>
          Fruta fresca de temporada. Sin conservantes. Cocción lenta en olla grande.</div>
        <div class="valor-card"><div class="valor-emoji">🏆</div><div class="valor-titulo">Compromiso</div>
          Fruta en su punto exacto, pequeños lotes, azúcar de caña y limón natural.</div>
        <div class="valor-card"><div class="valor-emoji">🎀</div><div class="valor-titulo">El toque</div>
          Cada frasco se etiqueta y decora a mano, uno por uno.</div>
      </div>
      <blockquote style="text-align:center;margin:44px auto 0;max-width:640px;
        font-family:'Pacifico',cursive;font-size:1.5rem;color:var(--primary-dark);">
        "Una explosión de sabor natural en cada cucharada."
      </blockquote>
    </section>
  `;
};;

const contacto = () => {
  $('#app').innerHTML = `
    <section class="seccion">
      <div class="section-head">
        <span class="section-kicker">Contacto</span>
        <h2 class="section-title">Hablemos 🍓</h2>
      </div>
      <div class="contacto-card">
        <div class="contacto-info"><strong>📍 Dirección</strong><br>Av. de las Flores 123, Quito</div>
        <div class="contacto-info"><strong>📞 Teléfono / WhatsApp</strong><br>+593 99 123 4567</div>
        <div class="contacto-info"><strong>✉️ Email</strong><br>pedidos@dulceencanto.com</div>
      </div>
      <div style="text-align:center;margin-top:40px;">
        <h3 style="color:var(--plum);">Síguenos</h3>
        <div style="display:flex;gap:14px;justify-content:center;margin-top:12px;flex-wrap:wrap;">
          <a href="#" class="btn btn-outline dark" style="padding:9px 20px;text-decoration:none;">📘 Facebook</a>
          <a href="#" class="btn btn-outline dark" style="padding:9px 20px;text-decoration:none;">📷 Instagram</a>
          <a href="#" class="btn btn-outline dark" style="padding:9px 20px;text-decoration:none;">🎬 TikTok</a>
        </div>
      </div>
    </section>
  `;
};;

const loginView = () => {
  $('#app').innerHTML = `
    <section class="seccion" style="max-width:400px;margin:0 auto;">
      <h2>Iniciar Sesión</h2>
      <form id="login-form">
        <div class="form-group">
          <label>Email</label>
          <input type="email" required>
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" required>
        </div>
        <button type="submit" class="btn-finalizar" style="width:100%;margin-top:16px;">Ingresar</button>
      </form>
      <p style="text-align:center;margin-top:20px;">
        ¿No tienes cuenta? <a href="#/registro">Regístrate aquí</a>
      </p>
    </section>
  `;

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#login-form').querySelector('input[type="email"]').value;
    const password = $('#login-form').querySelector('input[type="password"]').value;
    login(email, password);
  });
};

const registroView = () => {
  $('#app').innerHTML = `
    <section class="seccion" style="max-width:400px;margin:0 auto;">
      <h2>Regístrate</h2>
      <form id="registro-form">
        <div class="form-group">
          <label>Nombre completo</label>
          <input type="text" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" required>
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" required minlength="6">
        </div>
        <button type="submit" class="btn-finalizar" style="width:100%;margin-top:16px;">Crear cuenta</button>
      </form>
      <p style="text-align:center;margin-top:20px;">
        Ya tienes cuenta? <a href="#/login">Ingresa aquí</a>
      </p>
    </section>
  `;

  document.getElementById('registro-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = $('#registro-form').querySelector('input[type="text"]').value;
    const email = $('#registro-form').querySelector('input[type="email"]').value;
    const password = $('#registro-form').querySelector('input[type="password"]').value;
    register(nombre, email, password);
  });
};

// --- Dashboard Admin ---
const adminView = async () => {
  // Doble capa frontend: sin rol admin no se carga la vista
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
    const fmt = (n) => fmtDinero(n);

    $('#admin-kpis').innerHTML = [
      [fmt(kpis.ganancia_total), 'Ganancia total', `${kpis.unidades_vendidas} frascos vendidos`],
      [kpis.pedidos_totales, 'Pedidos totales', 'Histórico de ventas'],
      [kpis.unidades_vendidas, 'Frascos vendidos', 'Unidades totales'],
      [fmt(kpis.ventas_totales), 'Facturación', 'Sin pedidos cancelados']
    ].map(([v, t2, sub]) => `
      <div class="kpi-card">
        <div class="kpi-valor">${v}</div>
        <div class="kpi-etiqueta">${t2}</div>
        <div class="kpi-sub">${sub}</div>
      </div>`).join('');

    graficoLineas('chart-ventas-dia',
      ventas_por_dia.map((d) => ({ etiqueta: d.fecha.slice(5), valor: d.ventas })));
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
  } catch (e) { cont.innerHTML = `<p style="padding:16px;color:var(--error);">${esc(e.message)}</p>`; }
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
  } catch (e) { cont.innerHTML = `<p style="padding:16px;color:var(--error);">${esc(e.message)}</p>`; }
};





// --- Helpers varios ---
const red2 = (n) => Math.round(n * 100) / 100;

// PWA: registrar service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
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
    const payload = verificarToken(estado.token);
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
  if (estado.usuario) connectSSE();

  // Router inicial
  router();
  window.addEventListener('hashchange', router);
};

const updateUI = () => {
  const userBtn = $('.user-chip') || (() => { const d = document.createElement('div'); d.className = 'user-chip'; document.querySelector('nav')?.prepend(d); return d })();
  const cartBadge = $('#cart-badge') || (() => { const d = document.createElement('span'); d.className = 'cart-badge'; document.querySelector('.nav-links')?.prepend(d); return d })();

  if (estado.usuario) {
    userBtn.innerHTML = `${estado.usuario.nombre} 👤`;
    userBtn.classList.remove('oculto');
    cartBadge.textContent = estado.carrito.length;
  } else {
    userBtn.classList.add('oculto');
    cartBadge.textContent = '0';
  }
};

// Verificar si estamos en la página admin para inicializar el dashboard
if (window.location.hash === '#/admin' || window.location.pathname.includes('/admin')) {
  adminView();
} else {
  init();
}

// Helper global para acceder a los datos de productos desde el HTML
window.productData = productData;

// Exportar funciones útiles
window.agregarAlCarrito = agregarAlCarrito;
window.quitarDelCarrito = quitarDelCarrito;
window.fmtDinero = fmtDinero;
window.showToast = showToast;