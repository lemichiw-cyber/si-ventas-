import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorizeAdmin, AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../utils/crypto';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { items, direccionEnvio, metodoPago } = req.body; // items: [{productId, cantidad}]
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Carrito vacío' });

  let total = 0;
  const orderItemsData: any[] = [];
  for (const it of items) {
    const product = await prisma.product.findUnique({ where: { id: it.productId } });
    if (!product) return res.status(404).json({ error: `Producto ${it.productId} no encontrado` });
    if (product.stock < it.cantidad)
      return res.status(400).json({ error: `Stock insuficiente para ${product.nombre}` });
    const subtotal = product.precio * it.cantidad;
    total += subtotal;
    orderItemsData.push({
      productId: product.id,
      cantidad: it.cantidad,
      precioUnitario: product.precio,
      subtotal,
    });
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
    await prisma.product.update({
      where: { id: it.productId },
      data: { stock: { decrement: it.cantidad } },
    });
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
  const mapped = orders.map((o: any) => ({
    ...o,
    direccionEnvio: o.direccionEnvio ? decrypt(o.direccionEnvio) : null,
    trackingNumber: o.trackingNumber ? decrypt(o.trackingNumber) : null,
  }));
  res.json(mapped);
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  if (order.userId !== req.user!.userId && req.user!.rol !== 'admin')
    return res.status(403).json({ error: 'No autorizado' });

  res.json({
    ...order,
    direccionEnvio: order.direccionEnvio ? decrypt(order.direccionEnvio) : null,
    trackingNumber: order.trackingNumber ? decrypt(order.trackingNumber) : null,
  });
});

router.put('/:id/status', authenticate, authorizeAdmin, async (req, res) => {
  const { estado, trackingNumber, trackingCarrier } = req.body;
  const data: any = { estado };

  // Auto-set timestamps
  if (estado === 'enviado' && trackingNumber) {
    data.trackingNumber = encrypt(trackingNumber);
    data.trackingCarrier = trackingCarrier || null;
    data.shippedAt = new Date();
  }
  if (estado === 'entregado') {
    data.deliveredAt = new Date();
  }
  if (estado === 'cancelado') {
    data.deliveredAt = null;
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data,
    include: { items: { include: { product: true } } },
  });

  // Notify user if tracking was just set
  if (trackingNumber && trackingCarrier) {
    try {
      const { notifyTrackingUpdate } = await import('../utils/supabase');
      notifyTrackingUpdate(order.userId, trackingNumber, trackingCarrier).catch(() => {});
    } catch (e) {
      // Supabase not configured — skip notification
    }
  }

  // Decrypt for response
  const responseOrder = {
    ...order,
    trackingNumber: order.trackingNumber ? decrypt(order.trackingNumber) : null,
    direccionEnvio: order.direccionEnvio ? decrypt(order.direccionEnvio) : null,
  };

  res.json(responseOrder);
});

// Separate endpoint for updating just the tracking number
router.put('/:id/tracking', authenticate, authorizeAdmin, async (req, res) => {
  const { trackingNumber, trackingCarrier } = req.body;
  if (!trackingNumber) return res.status(400).json({ error: 'trackingNumber requerido' });

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      trackingNumber: encrypt(trackingNumber),
      trackingCarrier: trackingCarrier || null,
    },
    include: { items: true },
  });
  res.json({ message: 'Tracking actualizado', order });
});

// Public tracking lookup (no auth required) — customers check order by ID
router.get('/:id/tracking', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { product: { select: { nombre: true, imagenPrincipal: true } } } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

  res.json({
    id: order.id,
    estado: order.estado,
    total: order.total,
    metodoPago: order.metodoPago,
    trackingNumber: order.trackingNumber ? decrypt(order.trackingNumber) : null,
    trackingCarrier: order.trackingCarrier,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    items: order.items.map((i: any) => ({
      id: i.id,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      subtotal: i.subtotal,
      nombre: i.product?.nombre || 'Producto',
      imagen: i.product?.imagenPrincipal || null,
    })),
  });
});

export default router;
