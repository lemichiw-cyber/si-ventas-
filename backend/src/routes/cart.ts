import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function parseItems(cart: any) {
  try { return cart.items ? JSON.parse(cart.items as unknown as string) : []; } catch { return []; }
}

function stringifyItems(items: any[]) { return JSON.stringify(items); }

// Helper to get cart: supports sessionId via header X-Session-Id or userId
async function getOrCreateCart(sessionId: string | undefined, userId: string | undefined) {
  if (userId) {
    let cart = await prisma.cartSession.findFirst({ where: { userId } });
    if (!cart) {
      cart = await prisma.cartSession.create({ data: { userId, items: stringifyItems([]), expiresAt: new Date(Date.now() + 7*24*60*60*1000) } });
    }
    return cart;
  }
  if (!sessionId) return null;
  let cart = await prisma.cartSession.findFirst({ where: { sessionId } });
  if (!cart) {
    cart = await prisma.cartSession.create({ data: { sessionId, items: stringifyItems([]), expiresAt: new Date(Date.now() + 7*24*60*60*1000) } });
  }
  return cart;
}

router.get('/', async (req: AuthRequest, res) => {
  const sessionId = req.headers['x-session-id'] as string | undefined;
  const authHeader = req.headers.authorization;
  let userId: string | undefined;
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      const jwt = await import('../utils/jwt');
      const payload = jwt.verifyAccessToken(token);
      userId = payload.userId;
    } catch {}
  }
  const cart = await getOrCreateCart(sessionId, userId);
  if (!cart) return res.json({ items: [], sessionId: uuidv4() });
  res.json({ id: cart.id, items: parseItems(cart), expiresAt: cart.expiresAt, sessionId: (cart as any).sessionId });
});

router.post('/items', async (req, res) => {
  const { productId, cantidad = 1, sessionId: bodySessionId } = req.body;
  const headerSessionId = req.headers['x-session-id'] as string | undefined;
  const sessionId = bodySessionId || headerSessionId || uuidv4();
  // try user
  let userId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try { const { verifyAccessToken } = await import('../utils/jwt'); userId = verifyAccessToken(authHeader.split(' ')[1]).userId; } catch {}
  }
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  let cart = await getOrCreateCart(sessionId, userId);
  if (!cart) {
    cart = await prisma.cartSession.create({ data: { sessionId, items: stringifyItems([]), expiresAt: new Date(Date.now()+7*24*60*60*1000) } });
  }
  const items = parseItems(cart);
  const existingIdx = items.findIndex((i: any) => i.product_id === productId);
  if (existingIdx >= 0) items[existingIdx].cantidad += cantidad;
  else items.push({ product_id: productId, cantidad, precio_snapshot: product.precio, nombre: product.nombre, imagen: product.imagenPrincipal });

  const updated = await prisma.cartSession.update({ where: { id: cart.id }, data: { items: stringifyItems(items) } });
  res.json({ items: parseItems(updated), sessionId });
});

router.put('/items/:productId', async (req, res) => {
  const { productId } = req.params;
  const { cantidad, sessionId: bodySid } = req.body;
  const sid = bodySid || req.headers['x-session-id'] as string;
  let userId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader) try { const { verifyAccessToken } = await import('../utils/jwt'); userId = verifyAccessToken(authHeader.split(' ')[1]).userId; } catch {}
  const cart = await getOrCreateCart(sid, userId);
  if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
  let items = parseItems(cart);
  items = items.map((i: any) => i.product_id === productId ? { ...i, cantidad } : i).filter((i: any) => i.cantidad > 0);
  const updated = await prisma.cartSession.update({ where: { id: cart.id }, data: { items: stringifyItems(items) } });
  res.json({ items: parseItems(updated) });
});

router.delete('/items/:productId', async (req, res) => {
  const { productId } = req.params;
  const sid = (req.query.sessionId as string) || req.headers['x-session-id'] as string;
  let userId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader) try { const { verifyAccessToken } = await import('../utils/jwt'); userId = verifyAccessToken(authHeader.split(' ')[1]).userId; } catch {}
  const cart = await getOrCreateCart(sid, userId);
  if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
  let items = parseItems(cart);
  items = items.filter((i: any) => i.product_id !== productId);
  const updated = await prisma.cartSession.update({ where: { id: cart.id }, data: { items: stringifyItems(items) } });
  res.json({ items: parseItems(updated) });
});

// authenticated helper
router.get('/mine', authenticate, async (req: AuthRequest, res) => {
  const cart = await prisma.cartSession.findFirst({ where: { userId: req.user!.userId } });
  if (!cart) return res.json({ items: [] });
  res.json({ ...cart, items: parseItems(cart) });
});

export default router;
