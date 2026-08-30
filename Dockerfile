# ─────────────────────────────────────────────────────
# Dulce Encanto — Dockerfile para Render.com
# Un solo Web Service: Nginx (frontend estático + proxy /api)
# + API Node/Express en el mismo contenedor.
# ─────────────────────────────────────────────────────

# ── Etapa 1: Build del backend ──
FROM node:20-slim AS backend-build
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY backend/package.json ./
COPY backend/tsconfig.json backend/tsconfig.seed.json ./
COPY backend/prisma ./prisma
RUN npm install && npx prisma generate
COPY backend/src ./src
RUN npm run build && npx tsc -p tsconfig.seed.json

# ── Etapa 2: Build del frontend ──
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
# VITE_API_URL relativo => same-origin (sin CORS, ruta pública única)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
COPY frontend/package.json ./
COPY frontend/tsconfig.json frontend/tsconfig.node.json ./
COPY frontend/tailwind.config.js frontend/postcss.config.js frontend/vite.config.ts ./
COPY frontend/index.html ./
COPY frontend/src ./src
RUN npm install && npm run build

# ── Etapa 3: Runtime (Web Service único) ──
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      nginx gettext-base tini openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/dist-seed ./dist-seed
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/src ./src

# Frontend compilado servido por Nginx
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Configuración de nginx + entrypoint
COPY deploy/nginx.conf.template /etc/nginx/nginx.conf.template
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Render entrega el tráfico al $PORT del contenedor; el backend usa 4000 interno
ENV PORT=4000
EXPOSE 10000

CMD ["/usr/bin/tini", "--", "/entrypoint.sh"]