<div align="center">

# 🛒 SiVentas

### Full-Stack E-commerce Store · Zero Dependencies · Ready to Launch

**Vanilla JS SPA · Node.js (zero-dependency) · SQLite · SSE Real-time · Email notifications**

A complete online store you can rebrand in minutes: product catalog,
shopping cart, checkout with taxes & shipping, order tracking,
admin dashboard with live charts and stock alerts.

[Features](#-features) · [Quick Start](#-quick-start) · [Screenshots](#-screenshots) · [Tech Stack](#-tech-stack) · [Docs](#-documentation) · [License](#-license)

</div>

---

## ✨ Features

**Storefront**
- 🍓 **Product catalog** with search, featured products and detail pages
- 🛒 **Shopping cart** — add/remove, quantities, fly-to-cart animation, live badge
- 💳 **Checkout** — subtotal + configurable tax & shipping (free shipping threshold)
- 🎟️ **Coupon system** — percentage/fixed codes validated server-side, stored per order
- 💱 **Multi-currency ready** — symbol/code/position via env vars
- 🛍️ **Catalog mode** — `CATALOGO_SIN_VENTA=true` turns the store into a showcase ("Contact us")
- 📦 **Order tracking** for customers by order number + email
- ⚡ **Real-time stock updates** via Server-Sent Events — no page refresh

**Admin dashboard** (`#/admin`, double-layer protected)
- 📊 **KPIs**: revenue, estimated profit, units sold, orders
- 📈 **Charts** built from scratch (no chart library): 14-day sales line, top flavors bars
- ⚠️ **Low-stock alerts** pushed live over SSE
- 🧾 **Orders table** with status workflow (`pendiente → pagado → enviado → entregado`)
- 🏷️ **Products CRUD** + one-click stock adjuster (every change logged to `movimientos_stock`)
- 👥 Customer rankings · 📧 Outbound email log with retry queue

**Under the hood**
- 🚫 **Zero npm dependencies** — runs on plain Node.js ≥22.5 (`node:sqlite` native)
- 🔐 HMAC-SHA256 signed tokens + scrypt password hashing + timing-safe comparison
- 🚦 In-memory rate limiting on auth endpoints (30 attempts / 15 min / IP)
- 🛡️ Security headers out of the box (`nosniff`, `X-Frame-Options`, `Referrer-Policy`)
- ✉️ Transactional emails via Resend or SMTP — with pending-retry queue and simulated mode
- 🐳 Docker one-command deploy · PWA installable (manifest + service worker)

---

## 🚀 Quick Start

### Option A — Docker

```bash
git clone https://github.com/YOUR_USERNAME/si-ventas-.git siventas
cd siventas
docker compose up --build
```

Store → http://localhost:3000 · Admin → http://localhost:3000/#/admin

### Option B — Local (no install step at all)

```bash
node server.js        # that's it. No npm install needed.
```

> Optional config lives in `.env` — see [.env.example](./.env.example).

### Default accounts (seeded on first run)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@dulceencanto.com` | `Admin123*` |
| Customer | `cliente@demo.com` | `Cliente123*` |

---

## 📸 Screenshots

> 📍 Place captures in `docs/screenshots/`.

| Storefront | Product | Admin dashboard |
|------------|---------|-----------------|
| ![store](docs/screenshots/store.png) | ![product](docs/screenshots/product.png) | ![admin](docs/screenshots/admin.png) |

## 🎨 Rebranding in 5 minutes

All branding lives in one place:
1. Colors & fonts → `public/css/styles.css` CSS variables at the top
2. Business name, slogan, contact → `src/config.js → CONFIG.NEGOCIO`
3. Logo/icons → `public/js/svg.js`
4. Products & seed data → `src/db.js → sembrar()`

Change the demo jam shop into YOUR store by editing those 4 spots.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS SPA (hash router), hand-built SVG illustrations, custom charts |
| Backend | Node.js ≥ 22.5 — **zero external dependencies**, native `node:sqlite` |
| Auth | HMAC-SHA256 tokens, scrypt hashing, timing-safe verification |
| Real-time | Server-Sent Events (stock + low-stock alerts) |
| Email | Resend API or SMTP, retry queue, simulated mode for dev |
| Deploy | Docker / docker-compose, Render blueprint included |

## 📖 Documentation

| File | Contents |
|------|----------|
| [SETUP.md](./SETUP.md) | Local setup, Docker, Render deploy, env reference |
| [.env.example](./.env.example) | Every environment variable explained |
| [SELLING-GUIDE.md](./SELLING-GUIDE.md) | Marketplace listing kit |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |

## 🗂️ Project Structure

```
├── public/            # SPA served statically (css/, js/, icons/, manifest)
├── src/
│   ├── api.js         # All API routes (Router class, ctx pattern)
│   ├── auth.js        # scrypt hashing + token sign/verify
│   ├── config.js      # .env loader + business configuration
│   ├── db.js          # SQLite schema, migrations and demo seed
│   ├── http.js        # Router, body parser, HttpError helpers
│   └── mailer.js      # Resend/SMTP sender + retry queue
├── server.js          # HTTP server: static files + API dispatch
└── docker-compose.yml # One-command full stack with persistent DB
```

## 🔌 API Overview

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/config` · `/api/productos[/:slug]` | public |
| POST | `/api/auth/registro` · `/api/auth/login` · `/api/auth/admin` | public (rate-limited) |
| GET | `/api/auth/me` · `/api/pedidos/:numero?email=` | user |
| POST | `/api/pedidos` | user |
| GET | `/api/eventos` (SSE stock stream) | public |
| GET/PATCH | `/api/admin/pedidos` · `/pedidos/:id/estado` | admin |
| CRUD | `/api/admin/productos[/:id][/stock]` | admin |
| GET | `/api/admin/resumen` · `/movimientos` · `/clientes` · `/emails` | admin |

## 📄 License

Released under the [MIT License](./LICENSE).
