import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';

const app = express();
const PORT = process.env.PORT || 4000;

// Orígenes permitidos (separados por coma): Render (same-origin), GitHub Pages, localhost
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Rate limiting global 100 req/15min
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', name: 'Dulce Encanto API' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🍓 Dulce Encanto API corriendo en http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});

export default app;
