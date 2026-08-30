import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorizeAdmin, AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../utils/crypto';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { items, direccionEnvio, metodoPago } = req.body; // items: [{productId, cantidad}]
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Carrito vacío' });

  let total = 0;
  const orderItemsData: any[] = [];
  for (const it of items) {
    const product = await prisma.product.findUnique({ where: { id: it.productId } });
    if (!product) return res.status(404).json({ error: `Producto ${it.productId} no encontrado` });
    if (product.stock < it.cantidad) return res.status(400).json({ error: `Stock insuficiente para ${product.nombre}` });
    const subtotal = product.precio * it.cantidad;
    total += subtotal;
    orderItemsData.push({ productId: product.id, cantidad: it.cantidad, precioUnitario: product.precio, subtotal });
  }

  const order = await prisma.order.create({
    data: {
      userId: req.user!.userId,
      total,
      direccionEnvio: direccionEnvio ? encrypt(direccionEnvio) : null,
      metodoPago: metodoPago || 'mock',
      estado: 'pagado',
      items: { create: orderItemsData },
    },
    include: { items: true },
  });

  // decrement stock
  for (const it of orderItemsData) {
    await prisma.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.cantidad } } });
  }

  // clear cart
  await prisma.cartSession.deleteMany({ where: { userId: req.user!.userId } });

  res.status(201).json(order);
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const isAdmin = req.user!.rol === 'admin';
  const orders = await prisma.order.findMany({
    where: isAdmin ? {} : { userId: req.user!.userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const mapped = orders.map(o => ({ ...o, direccionEnvio: o.direccionEnvio ? decrypt(o.direccionEnvio) : null }));
  res.json(mapped);
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: { include: { product: true } } } });
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  if (order.userId !== req.user!.userId && req.user!.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  res.json({ ...order, direccionEnvio: order.direccionEnvio ? decrypt(order.direccionEnvio) : null });
});

router.put('/:id/status', authenticate, authorizeAdmin, async (req, res) => {
  const { estado } = req.body; // pendiente/pagado/enviado/entregado/cancelado
  const order = await prisma.order.update({ where: { id: req.params.id }, data: { estado } });
  res.json(order);
});

export default router;
