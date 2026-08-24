import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAIZ, CONFIG } from './src/config.js';
import { router } from './src/api.js';
import { HttpError } from './src/http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLICO = path.join(RAIZ, 'public');

const MIMETYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

function servirArchivo(res, filepath, tipo) {
  fs.readFile(filepath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': tipo });
    res.end(data);
  });
}

async function manejarApi(req, res, url) {
  const ruta = url.pathname.replace(/^\/api/, '') || '/';
  const metodo = req.method === 'HEAD' ? 'GET' : req.method;
  const match = router.resolver(metodo, ruta);

  if (!match) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'Ruta de API no encontrada' }));
  }

  const ctx = {
    req,
    res,
    params: match.params,
    request: { query: Object.fromEntries(url.searchParams.entries()) },
    user: null,
    json(status, data) {
      if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      if (!res.writableEnded) res.end(JSON.stringify(data));
    },
    throw(estado, mensaje) { throw new HttpError(estado, mensaje); }
  };

  try {
    for (const manejador of match.ruta.manejadores) {
      await manejador(ctx);
    }
    if (!res.headersSent) ctx.json(204, { ok: true });
  } catch (e) {
    if (res.headersSent) return res.end();
    if (e instanceof HttpError) return ctx.json(e.estado, { error: e.message });
    console.error('[API]', req.method, url.pathname, e);
    ctx.json(500, { error: 'Error interno del servidor' });
  }
}

function servirStaticos(req, res, url) {
  let filepath = path.join(PUBLICO, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
  const normalized = path.normalize(filepath);
  if (!normalized.startsWith(PUBLICO)) {
    res.writeHead(403); return res.end('Prohibido');
  }
  const ext = path.extname(filepath) || '.html';
  if (!fs.existsSync(filepath)) filepath = path.join(PUBLICO, 'index.html');
  servirArchivo(res, filepath, MIMETYPES[path.extname(filepath)] || MIMETYPES['.html']);
}

const servidorHttp = createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  if (url.pathname.startsWith('/api/')) {
    manejarApi(req, res, url).catch((e) => {
      console.error('[API fatal]', e);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error interno' }));
    });
    return;
  }

  servirStaticos(req, res, url);
});

servidorHttp.listen(CONFIG.PUERTO, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log(`║  🍓  Dulce Encanto — http://localhost:${String(CONFIG.PUERTO).padEnd(4)} ║`);
  console.log(`║  👤  Admin: admin@dulceencanto.com          ║`);
  console.log('╚════════════════════════════════════════════╝');
});
