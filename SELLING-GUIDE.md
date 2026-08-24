# 💰 SELLING GUIDE — How to package & sell SiVentas

This guide turns this codebase into a listed product on
CodeCanyon, Gumroad or Flippa.

---

## 1 · Positioning

**What you are selling:** a *zero-dependency e-commerce starter* —
the rarest kind. No `npm install`, no database server, no build step.
Runs on the cheapest VPS or even a Raspberry Pi. That's the hook.

Target buyers: small businesses needing a simple store, freelancers
delivering client shops, developers who want a clean SSE + SQLite reference.

---

## 2 · Where to sell

| Platform | Best for | Notes |
|----------|----------|-------|
| **CodeCanyon** | E-commerce templates sell very well there | English docs required (README included), strict QA |
| **Gumroad** | Instant launch + upsells | Bundle source + setup PDF + rebranding video |
| **Flippa** | Sell WITH the live store as a business | Higher prices; include traffic proof if any |

Start on Gumroad today; submit to CodeCanyon for reach and badge credibility.

---

## 3 · Suggested pricing tiers

| Tier | Price | Includes |
|------|-------|----------|
| 🥉 Personal | **$39** | Source, 1 end-product, 6 months updates |
| 🥈 Commercial | **$99** | + client projects, priority support 3 months, deployment session |
| 🥇 Extended / White-label | **$179–249** | + resale in your own SaaS, branding removal rights, 12 months updates |

E-commerce templates price higher than dashboards — buyers expect to make money with them.
Add-ons: installation service (+$49), custom branding pack (+$99), payment-gateway integration (+$149).

---

## 4 · Sale package contents

- ✅ This repository, tagged release
- ✅ README.md · SETUP.md · .env.example · CHANGELOG.md
- ✅ `docs/screenshots/`: storefront desktop+mobile, product page, cart,
  checkout, admin dashboard (charts!), stock alert SSE in action
- ✅ 60–90 s demo video: open store → add to cart → checkout → admin sees order
  live via SSE → change order status → adjust stock
- ✅ Live demo URL (free Render deploy per SETUP §3)
- ⛔ Exclude: `.env`, real keys, `data/` folder

---

## 5 · Reusable listing copy

> **SiVentas — Zero-Dependency E-commerce Store (Node.js + SQLite)**
>
> A complete online store that runs ANYWHERE Node runs — no npm install,
> no database server, no build tools. Catalog, cart, checkout with taxes &
> shipping, order tracking, and an admin dashboard with live sales charts and
> real-time stock alerts over Server-Sent Events. Emails included.
> Rebrand the entire shop by editing 4 files.

Tags: ecommerce template, nodejs store, sqlite, shopping cart, sse,
admin dashboard, zero dependency, white label store.

---

## 6 · Pre-listing checklist

- [ ] Fill `[Tu Nombre o Tu Empresa]` in LICENSE
- [ ] Point repo URLs in README at YOUR public repo
- [ ] Real screenshots in docs/screenshots/
- [ ] Demo video recorded
- [ ] Live demo deployed with nightly data reset (`docker compose down -v`)
- [ ] Version tagged (`git tag v1.0.0`)
