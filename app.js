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
  sseClientes: new Set()
};

// --- Elementos DOM reutilizados ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const toastContainer = $('#toast-container') || (() => { const d = document.createElement('div'); d.id = 'toast-container'; document.body.appendChild(d); return d })();

// --- Utilidades ---
const fmtDinero = (n) => `$${Number(n).toFixed(2)}`;
const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' }[c]));
const showToast = (msg, tipo = 'éxito') => {
  const tipoMap = { éxito: 'var(--morado)', error: '#e53e3e', warning: '#d65d0e' };
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = tipoMap[tipo] || var(--morado);
  toast.textContent = msg;
  toastContainer.appendChild(toast);
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
  }
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
      <h1>Dulce Encanto</h1>
      <p class="eslogan">"Una explosión de sabor natural en cada cucharada. ¡Hechas con amor y fruta fresca!"</p>
      <a href="#/catalogo" class="cta-btn">Explorar sabores</a>
    </section>

    <div class="seccion" id="destacados">
      <h2>Mermeladas Destacadas</h2>
      <div class="contenido" id="destacados-grid"></div>
    </div>

    <div class="seccion" style="background:var(--crema);padding:60px 24px;">
      <h2>Nuestro Compromiso</h2>
      <p>Ofrecer mermeladas de calidad, naturales y deliciosas, elaboradas con el mejor cuidado.</p>
      <p>Usamos solo frutas frescas de temporada, azúcar de caña y jugo natural de limón. Sin conservantes artificiales. Hechas a mano en pequeños lotes.</p>
    </div>
  `;

  // Renderizar tarjetas destacadas
  const grid = $('#destacados-grid');
  if (grid) {
    productData.slice(0, 3).forEach((p, i) => {
      const imgSvg = frascoSvg(getSvgKey(p.imagen), 60);
      grid.innerHTML += `
        <div class="card-producto destacado" data-slug="${p.slug}">
          ${imgSvg}
          <div class="nombre">${p.nombre}</div>
          <div class="precio">${fmtDinero(p.precio)} por frasco</div>
          <div class="stock" data-stock="${p.stock}">${p.stock > 0 ? `${p.stock} unidades disponibles` : 'Agotado'}</div>
          <button class="btn-agregar" data-slug="${p.slug}">Añadir al carrito</button>
          ${p.stock <= 5 ? `<span class="stock-alert">¡Últimas unidades!</span>` : ''}
        </div>`;
    });
  }
  // Event listeners para "Añadir al carrito"
  document.querySelectorAll('#destacados-grid .btn-agregar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const slug = btn.getAttribute('data-slug');
      agregarAlCarrito(slug);
    });
  }
};

const catalogo = () => {
  $('#app').innerHTML = `
    <section class="seccion" id="catalogo">
      <h2>Nuestros Sabores</h2>
      <p>Mermeladas artesanales de frutas frescas</p>
      <div class="contenido" id="catalogo-grid"></div>
    </section>
    <nav class="nav-links" style="margin-top:20px;justify-content:center;">
      <a href="#/">Inicio</a>
      <a href="#/catalogo" class="activo">Catálogo</a>
      <a href="#/nosotros">Nosotros</a>
      <a href="#/contacto">Contacto</a>
      ${estado.usuario && estado.usuario.rol !== 'admin'
        ? `<a href="#/carrito">Carrito <span class="cart-badge" id="cart-badge">0</span></a>`
        : `<a href="#/login">Login</a>`}
    </nav>
  `;

  const grid = $('#catalogo-grid');
  if (grid) {
    productData.forEach((p) => {
      const bajo = p.stock < p.stock_minimo;
      const imgSvg = frutaSvg(getSvgKey(p.imagen), 50);
      grid.innerHTML += `
        <article class="card-producto ${p.destacado ? 'destacado' : ''}" data-slug="${p.slug}">
          ${imgSvg}
          <div class="nombre">${p.nombre}</div>
          <div class="precio">${fmtDinero(p.precio)} por frasco</div>
          <div class="stock ${bajo ? 'bajo' : ''}" data-stock="${p.stock}">
            ${p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
            ${bajo ? '<span>¡Últimas!</span>' : ''}
          </div>
          <button class="btn-agregar" data-slug="${p.slug}">Añadir al carrito</button>
        </article>`;
    });
  }

  document.querySelectorAll('#catalogo-grid .btn-agregar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const slug = btn.getAttribute('data-slug');
      agregarAlCarrito(slug);
    });
  });
};

const productoFicha = (param) => {
  const producto = productData.find(p => p.slug === param);
  if (!producto) return showToast('Producto no encontrado', 'error');

  $('#app').innerHTML = `
    <section class="producto-ficha">
      <img class="imagen-principal" src="${frascoSvg(getSvgKey(producto.imagen), 80)}" alt="${producto.nombre}">
      <h1>${producto.nombre}</h1>
      <p class="tagline">${producto.tagline}</p>
      <div class="precio">${fmtDinero(producto.precio)} por frasco</div>
      <div class="ingredientes">
        <strong>Ingredientes:</strong> ${producto.ingredientes}
      </div>
      <div class="stock-info ${producto.stock === 0 ? 'agotado' : producto.stock < producto.stock_minimo ? 'low' : 'disponible'}">
        <span class="cantidad">${producto.stock > 0 ? `Stock: ${producto.stock} unidades` : 'Agotado'}</span>
      </div>
      <div class="cantidad-selector">
        <label>Cantidad:</label>
        <input type="number" id="cantidad-input" min="1" max="${producto.stock > 0 ? producto.stock : 1}" value="1" class="cantidad-input">
      </div>
      <button class="btn-agregar-carrito" data-slug="${producto.slug}">
        Añadir al carrito
      </button>
    </section>
    <nav class="nav-links" style="margin-top:20px;justify-content:center;">
      <a href="#/catalogo">← Volver al catálogo</a>
    </nav>
  `;

  const inputCantidad = $('#cantidad-input');
  const btnAgregar = $(`.btn-agregar-carrito[data-slug="${producto.slug}"]`);

  if (inputCantidad && btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      const qty = parseInt(inputCantidad.value) || 1;
      if (producto.stock < qty) {
        showToast(`Solo quedan ${producto.stock} unidades`, 'warning');
        return;
      }
      agregarAlCarrito(producto.slug, qty);
      inputCantidad.value = 1;
    });
  }
};

const carrito = () => {
  cargarCarrito();
  $('#app').innerHTML = `
    <section class="seccion carrito-vacio" id="carrito-contenido">
      Tu carrito está vacío
    </section>
  `;
};

const checkout = () => {
  if (estado.carrito.length === 0) {
    showToast('El carrito está vacío', 'warning');
    return history.back();
  }

  const subtotal = estado.carrito.reduce((s, i) => {
    const p = productData.find(p => p.slug === i.slug);
    return s + p.precio * i.cantidad;
  }, 0);
  const impuesto = red2(subtotal * 0.15);
  const envio = subtotal >= 15 ? 0 : 1.5;
  const total = red2(subtotal + impuesto + envio);

  $('#app').innerHTML = `
    <section class="seccion checkout">
      <h2>Finalizar Compra</h2>
      <form class="checkout-form" id="checkout-form">
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
          <div class="fila"><span>IVA (15%)</span>${fmtDinero(impuesto)}</div>
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
    <section class="seccion" id="nosotros">
      <h2>Nuestra Historia</h2>
      <p>En Dulce Encanto nacimos del amor por las mermeladas artesanales y el deseo de compartir el sabor de la fruta fresca de nuestra tierra.</p>
      <p>Cada frasco es el resultado de horas de trabajo seleccionando la mejor fruta, cocinando a fuego lento y poniendo todo nuestro cuidado en cada cucharada.</p>

      <div class="nosotros-contenido">
        <div class="nosotros-grid">
          <div class="nosotros-grid valores">
            <h3>Nuestra Filosofía</h3>
            <ul>
              <li>Fruta fresca de temporada, siempre.</li>
              <li>Sin conservantes artificiales.</li>
              <li>Proceso artesanal: cocción lenta en olla grande.</li>
              <li>Etiquetado y decorado a mano.</li>
            </ul>
          </div>
          <div class="nosotros-grid imagen">
            <img src="${frascoSvg('fresa', 120)}" alt="Mermelada artesanal">
          </div>
        </div>

        <div class="nosotros-grid">
          <div class="nosotros-grid valores">
            <h3>Compromiso de Calidad</h3>
            <ul>
              <li>Seleccionamos la fruta en su punto exacto de maduración.</li>
              <li>Cocemos en pequeños lotes para conservar el sabor.</li>
              <li>Usamos azúcar de caña y jugo natural de limón.</li>
              <li>Cada frasco se etiqueta y decora a mano.</li>
            </ul>
          </div>
          <div class="nosotros-grid imagen">
            <img src="${frascoSvg('mora', 120)}" alt="Mermelada de mora">
          </div>
        </div>
      </div>

      <div style="margin-top:40px;padding-top:24px;border-top:2px solid var(--rosa-suave);">
        <p>"Una explosión de sabor natural en cada cucharada. ¡Hechas con amor y fruta fresca!"</p>
      </p>
    </section>
  `;
};

const contacto = () => {
  $('#app').innerHTML = `
    <section class="seccion" id="contacto">
      <h2>Contacto</h2>
      <div class="contacto-info">
        <div class="contacto-card">
          <h3>📍 Dirección</h3>
          <p>Av. de las Flores 123, Quito</p>
        </div>
        <div class="contacto-card">
          <h3>📞 Teléfono</h3>
          <p>+593 99 123 4567</p>
        </div>
        <div class="contacto-card">
          <h3>✉️ Email</h3>
          <p>pedidos@dulceencanto.com</p>
        </div>
      </div>
      <div style="margin-top:40px;">
        <h3>Redes Sociales</h3>
        <div style="display:flex;gap:12px;margin-top:12px;">
          <a href="#" style="color:var(--morado);text-decoration:none;font-size:18px;">📘 Facebook</a>
          <a href="#" style="color:#E1306C;text-decoration:none;font-size:18px;">📷 Instagram</a>
          <a href="#" style="color:#01CF70;text-decoration:none;font-size:18px;">🎬 TikTok</a>
        </div>
      </div>
    </section>
  `;
};

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
const adminView = () => {
  // Verificar que sea admin
  if (!estado.usuario || estado.usuario.rol !== 'admin') {
    showToast('Acceso denegado - se requiere rol de administrador', 'error');
    window.location.hash = '#/';
    return;
  }

  // Credenciales admin: admin@dulceencanto.com / Admin123*
  const loginAdmin = async () => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: { email: 'admin@dulceencanto.com', password: 'Admin123*' }
    });
    if (data.usuario.rol === 'admin') {
      estado.token = data.token;
      estado.usuario = data.usuario;
      localStorage.setItem('dulce-token', data.token);
      localStorage.setItem('dulce-usuario', JSON.stringify(data.usuario));
      updateUI();
    }
  };

  loginAdmin();

  $('#app').innerHTML = `
    <section class="seccion" style="max-width:1200px;margin:0 auto;padding:20px 0;">
      <div style="background:var(--crema);border-radius:16px;padding:24px;margin-bottom:24px;">
        <h2>Panel de Administración Dulce Encanto</h2>
        <p>Bienvenida, ${estado.usuario.nombre}</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
        <!-- KPI Cards -->
        <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 6px var(--transparencia);">
          <div style="font-size:24px;color:var(--morado-profundo);">$${75.20}</div>
          <div style="font-size:14px;color:var(--tinta);">Ganancia Estimada</div>
          <div style="font-size:12px;color:var(--morado);">× 94 frascos × $0.80</div>
        </div>
        <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 6px var(--transparencia);">
          <div style="font-size:24px;color:var(--tinta);">12</div>
          <div style="font-size:14px;color:var(--tinta);">Pedidos Totales</div>
          <div style="font-size:12px;color:var(--morado);">Histórico de ventas</div>
        </div>
        <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 6px var(--transparencia);">
          <div style="font-size:24px;color:var(--tinta);">94</div>
          <div style="font-size:14px;color:var(--tinta);">Frascos Vendidos</div>
          <div style="font-size:12px;color:var(--morado);">Unidades totales</div>
        </div>
      </div>

      <!-- Gráficos -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;">
        <div>
          <h3 style="margin:0 0 12px 0;color:var(--morado-profundo);">Ventas por Últimos 14 Días</h3>
          <div id="chart-ventas-dia" style="height:150px;background:#fff;padding:16px;border-radius:8px;"></div>
        </div>
        <div>
          <h3 style="margin:0 0 12px 0;color:var(--morado-profundo);">Top Sabores Vendidos</h3>
          <div id="chart-top-sabores" style="height:150px;background:#fff;padding:16px;border-radius:8px;"></div>
        </div>
      </div>

      <!-- Stock Bajo -->
      <div style="margin-top:32px;background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 6px var(--transparencia);">
        <h3 style="margin:0 0 12px 0;color:var(--morado-profundo);">Stock Bajo (alerta)</h3>
        <p style="color:#e86a9a;font-size:14px;">Quedan pocas unidades de: Frutal Mixta (3 unidades)</p>
      </div>

      <!-- Últimos Pedidos -->
      <div style="margin-top:32px;background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 6px var(--transparencia);">
        <h3 style="margin:0 0 12px 0;color:var(--morado-profundo);">Últimos Pedidos</h3>
        <p>Ver historial en la API: <code>/api/admin/pedidos</code></p>
      </div>
    </div>
  `;

  // Inicializar gráficos
  setTimeout(() => {
    graficoBarras('chart-ventas-dia', [
      { etiqueta: 'Día 1', valor: 120 },
      { etiqueta: 'Día 2', valor: 95 },
      { etiqueta: 'Día 3', valor: 140 },
      { etiqueta: 'Día 4', valor: 80 },
      { etiqueta: 'Día 5', valor: 110 },
      { etiqueta: 'Día 6', valor: 130 },
      { etiqueta: 'Día 7', valor: 90 },
      { etiqueta: 'Día 8', valor: 115 },
      { etiqueta: 'Día 9', valor: 100 },
      { etiqueta: 'Día 10', valor: 125 },
      { etiqueta: 'Día 11', valor: 85 },
      { etiqueta: 'Día 12', valor: 135 },
      { etiqueta: 'Día 13', valor: 98 },
      { etiqueta: 'Día 14', valor: 110 }
    ]);
    graficoBarras('chart-top-sabores', [
      { etiqueta: 'Fresa Clásica', valor: 45 },
      { etiqueta: 'Mora Andina', valor: 38 },
      { etiqueta: 'Durazno Dorado', valor: 32 },
      { etiqueta: 'Mango Tropical', valor: 28 },
      { etiqueta: 'Frutal Mixta', valor: 22 }
    ]);
  }, 100);
};

// --- Helpers varios ---
const red2 = (n) => Math.round(n * 100) / 100;

// --- Inicio ---
const init = () => {
  // Cargar carrito desde localStorage
  cargarCarrito();

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