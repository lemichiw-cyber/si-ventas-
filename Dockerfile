# ── Dulce Encanto — tienda completa en un contenedor ──
# Node 22 incluye node:sqlite nativo (sin dependencias externas)
FROM node:22-alpine

RUN apk add --no-cache tini curl

WORKDIR /app

COPY public ./public
COPY src ./src
COPY server.js package.json ./

ENV NODE_ENV=production \
    PUERTO=3000 \
    JWT_SECRET=dulce-secreto-cambia-en-produccion \
    EMAIL_SIMULADO=true

VOLUME ["/app/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/config || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
