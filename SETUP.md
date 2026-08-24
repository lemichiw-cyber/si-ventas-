# ⚙️ SETUP — Installation & Deployment Guide

## Requirements

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 22.5 | required by native `node:sqlite` |
| Docker (optional) | ≥ 24 + compose plugin | one-command deploy |

**No `npm install` needed — the project has zero external dependencies.**

---

## 1 · Local development

```bash
node server.js
```

- Store → http://localhost:3000
- Admin panel → http://localhost:3000/#/admin
- API health → http://localhost:3000/api/config

The SQLite database (`data/dulce-encanto.db`) is created and seeded automatically on first start.

Optional `.env` (see [.env.example](./.env.example)) to change port, secret, tax, shipping or email settings.

---

## 2 · Production — Docker

```bash
export JWT_SECRETO="$(openssl rand -hex 32)"
docker compose up -d --build
```

Data persists in the `dulce-encanto_sqlite-data` volume.
Wipe data: `docker compose down -v`.

---

## 3 · Production — Render (free tier, one-click)

1. Push this repo to GitHub.
2. dashboard.render.com → **New → Web Service** → connect the repo.
3. Render detects `render.yaml` (`runtime: docker`) → **Apply**.
4. Environment variables are auto-generated (`JWT_SECRET`).

Live example: https://si-ventas.onrender.com

> Free instances sleep after ~15 min idle; first request takes ≈30–60 s to wake up.

---

## 4 · Environment variables reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PUERTO` / `PORT` | no | `3000` | HTTP port (Render injects `PORT`) |
| `JWT_SECRETO` | **yes (prod)** | dev fallback | Long random string — `openssl rand -hex 32` |
| `TOKEN_HORAS` | no | `168` | Session token lifetime in hours |
| `DB_ARCHIVO` | no | `data/dulce-encanto.db` | SQLite file location |
| `IVA` | no | `0.15` | Tax rate applied at checkout |
| `COSTO_ENVIO` | no | `1.5` | Shipping cost |
| `ENVIO_GRATIS_DESDE` | no | `15` | Free shipping threshold |
| `EMAIL_SIMULADO` | no | `true` | Log emails to console instead of sending |
| `RESEND_API_KEY` | no | — | Enable real emails via Resend |
| `SMTP_URL` | no | — | Or send via SMTP |

---

## 5 · Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Exits with *“define JWT_SECRETO”* | production without secret | set the env var |
| First request slow (~30 s) | Render free instance sleeping | expected; upgrade or keep-alive ping |
| `node:sqlite not found` | Node < 22.5 locally | upgrade Node, or use the Docker image |
| Admin login rejected | you used the customer endpoint | use `POST /api/auth/admin` (the panel does this automatically) |

---

## 6 · Reset demo data

```bash
docker compose down -v      # removes database volume
rm -rf data/                # local installs
```
