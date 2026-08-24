# 🚀 DEPLOY-GUIDE — Railway · Render · cPanel

## Opción A · Render (recomendado, blueprint incluido)
1. dashboard.render.com → New → Blueprint → conecta este repo
2. Render lee `render.yaml` (Docker) → Apply
3. URL lista con HTTPS y healthcheck. Free tier duerme tras 15 min.

## Opción B · Railway
1. railway.app → New Project → Deploy from GitHub
2. Railway detecta el Dockerfile automáticamente
3. Variables: `JWT_SECRETO=<openssl rand -hex 32>`, `NODE_ENV=production`
4. Generate Domain → listo.

> 💾 En ambos, añade un volumen montado en `/app/data` para que la BD
> sobreviva a los deploys (Render: disco pagado; Railway: volumen incluido).

## Opción C · Hosting compartido con cPanel (¡sin Node!)
Zero-dependencies = solo archivos estáticos… excepto el servidor.
Truco compatible:
1. Compila la SPA igual (los archivos de `public/` son estáticos)
2. Sube `public/` a `public_html/` vía File Manager
3. La parte del API requiere Node → si tu plan incluye "Setup Node.js App"
   (cPanel ≥ 86), crea la app apuntando a `server.js` con Start Command
   `node server.js`. Si no, usa Render/Railway gratis para el API y deja
   en cPanel solo el frontend apuntando por fetch al dominio del API.

## Post-deploy checklist
- [ ] `JWT_SECRETO` definido (nunca el default)
- [ ] Pedido de prueba creado desde la web
- [ ] Panel admin accesible en `/#/admin`
- [ ] HTTPS activo (Render/Railway lo dan gratis)
