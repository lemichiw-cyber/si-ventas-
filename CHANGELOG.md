# Changelog

## [1.1.0] — 2026-08-24

### Added
- Coupon system: `cupones` table, `POST /api/cupones/validar`, discount applied
  at checkout and persisted with the order (`descuento`, `cupon` columns).
  Seeded demo code: **WELCOME10** (-10%)
- Multi-currency support via env: `MONEDA_CODIGO`, `MONEDA_SIMBOLO`, `MONEDA_POSICION`
- Catalog mode: `CATALOGO_SIN_VENTA=true` hides cart/checkout and shows "Contáctenos"
- Docs: REBRAND-GUIDE.md · CUSTOMIZATION.md · DEPLOY-GUIDE.md (Render/Railway/cPanel)

## [1.0.0] — 2026-08-24

### Added
- Full e-commerce storefront: catalog with search, featured products, product detail
- Shopping cart with quantities, fly-to-cart animation and live item badge
- Checkout with configurable IVA, shipping cost and free-shipping threshold
- Customer order tracking by order number + email
- Admin dashboard (#/admin) protected by double-layer role checks:
  real KPIs, 14-day sales chart, top-sellers chart, low-stock alerts,
  orders table with status workflow, products table with ±1 stock adjuster
- Products CRUD with automatic stock movement logging
- Real-time stock updates via Server-Sent Events (+ public SSE stream)
- Email notifications for new orders via Resend or SMTP with retry queue and simulated mode
- Auth: scrypt password hashing, HMAC-SHA256 signed tokens, timing-safe verification
- In-memory rate limiting on auth endpoints (30 attempts / 15 min / IP)
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- PWA: manifest, service worker (offline cache), installable icons
- Docker deployment (Dockerfile + docker-compose) with persistent SQLite volume
- Render blueprint (render.yaml) for one-click free deployment
- Fail-fast JWT secret handling in production
- Zero external npm dependencies — runs on plain Node.js ≥ 22.5

### Fixed
- Repository structure restored (backend modules to src/, SPA to public/)
- Corrupted POST /orders handler rebuilt (try/catch nesting)
- Demo seed rewritten (broken statement, undeclared identifier, column mismatch)
- Tokens now cryptographically signed (previously forgeable base64 payloads)
