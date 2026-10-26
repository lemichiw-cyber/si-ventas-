# 🍓 Dulce Encanto — Mermeladas Artesanales

Tienda kawaii artesanal de mermeladas en El Salvador. **100 % estática**: se
publica en GitHub Pages y no necesita servidor, base de datos ni API.

> Eslogan: "Una explosión de sabor natural en cada cucharada. ¡Hechas con amor y fruta fresca!"

**En vivo:** https://lemichiw-cyber.github.io/si-ventas-/

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion +
  React Router + Zustand + TanStack Query
- **Sin backend:** el catálogo, los pedidos y las reseñas viven en el navegador

## Cómo funciona la tienda sin servidor

| Función | Cómo funciona |
| --- | --- |
| Catálogo | Datos estáticos en `frontend/src/data/catalogo.ts` |
| Carrito | `localStorage` (`dulce-cart`) con Zustand + persist |
| Pedido | Se guarda en `localStorage` (`dulce-pedidos`) con ID `DE-XXXXXX` y se envía por WhatsApp con el pedido ya escrito |
| Seguimiento | Busca el pedido en `localStorage` de ese dispositivo |
| Reseñas | Se guardan en `localStorage` (`dulce-resenas`) |
| Contacto | WhatsApp `+503 7998 0884` y correo `sakuraenterprise2@gmail.com` |

Al confirmar el pedido el sitio abre WhatsApp hacia el negocio con todo el
detalle (cliente, dirección, productos, subtotal, envío y total). No se cobra
ninguna tarjeta en línea: el pago es contra entrega o por transferencia.

## Cambiar precios, fotos o añadir productos

Todo el catálogo está en **`frontend/src/data/catalogo.ts`**. Cada producto
tiene nombre, slug, descripción, precio, stock, imágenes, ingredientes,
beneficios, información nutricional y reseñas. Después:

```bash
cd frontend
npm install
npm run build
```

El workflow `.github/workflows/deploy-pages.yml` compila y publica automáticamente
en cada `push` a `main`. La base (`VITE_BASE: /si-ventas-/`) es obligatoria:
GitHub Pages sirve el sitio bajo esa subcarpeta.

## Cambiar el teléfono o el correo

Los datos comerciales están en **`frontend/src/lib/tienda.ts`**:

```ts
export const CONTACTO = {
  whatsapp: '50379980884',     // solo dígitos, con prefijo de país
  telefono: '+50379980884',
  telefonoVisible: '+503 7998 0884',
  email: 'sakuraenterprise2@gmail.com',
  instagram: 'https://www.instagram.com/sakura_enterprise2/',
};
```

Ahí mismo se configuran el costo de envío, el umbral de envío gratis, los
departamentos y los métodos de pago.

## Estructura

```
frontend/
  index.html            metadatos SEO, Open Graph y JSON-LD
  public/               favicon, og-image, manifest, robots.txt, sitemap.xml
  src/
    data/catalogo.ts    productos y categorías (EDITAR AQUÍ)
    lib/tienda.ts       contacto, envío, métodos de pago (EDITAR AQUÍ)
    lib/catalog.ts      lectura del catálogo con filtros y búsqueda
    lib/pedidos.ts      creación y seguimiento de pedidos locales
    components/         Navbar (menú móvil accesible), Footer, ProductCard, FallbackImg
    pages/              Home, Catalog, ProductDetail, Cart, Checkout, Novedades, OrderTracking
```

### `backend/` (opcional, en desuso)

El backend Express + Prisma + Supabase que existía ya **no se usa**: la tienda
funciona completa sin él y no hay dónde desplegarlo gratis con base de datos
persistente. Se conserva la carpeta por si algún día se quiere reactivar, pero
el frontend no hace ninguna petición a una API.

Si algún día se restaura, habría que recrear `frontend/src/lib/api.ts` y volver
a conectar las páginas con TanStack Query contra esa API.

## Accesibilidad y SEO

- Menú móvil accesible: `aria-expanded`, cierre con Escape (devolviendo el foco),
  enlaces ocultos no enfocables.
- Sin desplazamiento horizontal a 1440 / 390 / 360 / 320 px.
- Estados de carga (esqueleto), vacío y error en todas las páginas de productos.
- `robots.txt`, `sitemap.xml`, `manifest.json`, Open Graph, Twitter Card y
  JSON-LD (`Organization`, `WebSite`, `Product`).

## Comprobaciones hechas

- Flujo completo: inicio → catálogo → producto → carrito → pedido → seguimiento.
- El mensaje de WhatsApp generado contiene ID, cliente, dirección, productos y totales.
- El seguimiento encuentra el pedido recién creado por su ID `DE-XXXXXX`.
- Sin errores de consola.
