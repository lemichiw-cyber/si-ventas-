import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { productId, rating, comentario } = req.body;
  if (!productId || !rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating inválido' });

  // verificar compra verificada
  const purchased = await prisma.order.findFirst({
    where: {
      userId: req.user!.userId,
      items: { some: { productId } },
      estado: { in: ['pagado', 'enviado', 'entregado'] },
    },
  });
  if (!purchased) return res.status(403).json({ error: 'Solo usuarios con compra verificada pueden reseñar' });

  const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId: req.user!.userId } } as any });
  if (existing) return res.status(409).json({ error: 'Ya reseñaste este producto' });

  const review = await prisma.review.create({
    data: { productId, userId: req.user!.userId, rating, comentario },
  });
  res.status(201).json(review);
});

export default router;
