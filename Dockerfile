# ── Dulce Encanto: tienda completa en un contenedor ──
FROM node:20-alpine

RUN apk add --no-cache sqlite tini

WORKDIR /app

# Cero dependencias externas: solo copiar código
COPY public ./public
COPY src ./src
COPY server.js package.json ./

# La BD vive en /app/data → montar volumen para persistencia
ENV NODE_ENV=production \
    PUERTO=3000 \
    JWT_SECRET=dulce-secreto-local-cambia-en-produccion

VOLUME ["/app/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/config >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
