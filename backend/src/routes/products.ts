import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorizeAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

function parseProduct(p: any) {
  if (!p) return p;
  try { p.imagenesGaleria = p.imagenesGaleria ? JSON.parse(p.imagenesGaleria as unknown as string) : []; } catch { p.imagenesGaleria = []; }
  try { p.ingredientes = p.ingredientes ? JSON.parse(p.ingredientes as unknown as string) : []; } catch { p.ingredientes = []; }
  try { p.beneficios = p.beneficios ? JSON.parse(p.beneficios as unknown as string) : []; } catch { p.beneficios = []; }
  return p;
}

// GET /api/products con filtros
router.get('/', async (req, res) => {
  const { categoria, precio_min, precio_max, novedades, recomendados, search, sort, page = '1', limit = '12' } = req.query as any;

  const where: any = {};
  if (categoria) {
    const cat = await prisma.category.findFirst({ where: { slug: String(categoria) } });
    if (cat) where.categoriaId = cat.id;
    else where.categoriaId = String(categoria);
  }
  if (precio_min || precio_max) {
    where.precio = {};
    if (precio_min) where.precio.gte = parseFloat(precio_min);
    if (precio_max) where.precio.lte = parseFloat(precio_max);
  }
  if (novedades === 'true') where.esNovedad = true;
  if (recomendados === 'true') where.esRecomendado = true;
  if (search) where.nombre = { contains: String(search) };

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'precio_asc') orderBy = { precio: 'asc' };
  if (sort === 'precio_desc') orderBy = { precio: 'desc' };
  if (sort === 'popular') orderBy = { esRecomendado: 'desc' };

  const take = Math.min(parseInt(String(limit), 10) || 12, 50);
  const skip = (Math.max(parseInt(String(page), 10) || 1, 1) - 1) * take;

  const [total, productsRaw] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where, orderBy, take, skip,
      include: { categoria: true, nutrition: true },
    }),
  ]);
  const products = productsRaw.map(parseProduct);

  res.json({ data: products, total, page: parseInt(String(page),10), limit: take, totalPages: Math.ceil(total/take) });
});

// GET by slug
router.get('/:slug', async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { slug: req.params.slug },
    include: { categoria: true, nutrition: true, reviews: { include: { user: { select: { nombre: true } } } } },
  });
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  parseProduct(product);

  // relacionados: misma categoría
  const relatedRaw = await prisma.product.findMany({
    where: { categoriaId: product.categoriaId, id: { not: product.id } },
    take: 4,
  });
  const related = relatedRaw.map(parseProduct);

  res.json({ ...product, related });
});

router.get('/:id/nutrition', async (req, res) => {
  // accept id or slug
  const product = await prisma.product.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }] }, include: { nutrition: true } });
  if (!product?.nutrition) return res.status(404).json({ error: 'Sin datos nutricionales' });
  res.json(product.nutrition);
});

router.get('/:id/reviews', async (req, res) => {
  const product = await prisma.product.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }] } });
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  const reviews = await prisma.review.findMany({ where: { productId: product.id }, include: { user: { select: { nombre: true, apellido: true } } }, orderBy: { createdAt: 'desc' } });
  res.json(reviews);
});

// Admin CRUD
const productSchema = z.object({
  body: z.object({
    nombre: z.string().min(2),
    slug: z.string().min(2),
    descripcion: z.string().min(10),
    precio: z.number().positive(),
    costoProduccion: z.number().positive(),
    stock: z.number().int().min(0).optional(),
    categoriaId: z.string().min(1),
    pesoNeto: z.string().optional(),
    ingredientes: z.array(z.string()).optional(),
    beneficios: z.array(z.string()).optional(),
    esNovedad: z.boolean().optional(),
    esRecomendado: z.boolean().optional(),
    imagenPrincipal: z.string().url().optional().or(z.string().optional()),
  }),
});

router.post('/', authenticate, authorizeAdmin, validate(productSchema), async (req: AuthRequest, res) => {
  const data = req.body;
  const product = await prisma.product.create({
    data: {
      nombre: data.nombre,
      slug: data.slug,
      descripcion: data.descripcion,
      precio: data.precio,
      costoProduccion: data.costoProduccion,
      stock: data.stock ?? 100,
      categoriaId: data.categoriaId,
      pesoNeto: data.pesoNeto,
      ingredientes: data.ingredientes ? JSON.stringify(data.ingredientes) : null,
      beneficios: data.beneficios ? JSON.stringify(data.beneficios) : null,
      esNovedad: data.esNovedad ?? false,
      esRecomendado: data.esRecomendado ?? false,
      imagenPrincipal: data.imagenPrincipal,
    },
  });
  res.status(201).json(parseProduct(product));
});

router.put('/:id', authenticate, authorizeAdmin, async (req: AuthRequest, res) => {
  const body: any = { ...req.body };
  if (body.ingredientes) body.ingredientes = JSON.stringify(body.ingredientes);
  if (body.beneficios) body.beneficios = JSON.stringify(body.beneficios);
  if (body.imagenesGaleria) body.imagenesGaleria = JSON.stringify(body.imagenesGaleria);
  const updated = await prisma.product.update({ where: { id: req.params.id }, data: body });
  res.json(parseProduct(updated));
});

router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Eliminado' });
});

export default router;
