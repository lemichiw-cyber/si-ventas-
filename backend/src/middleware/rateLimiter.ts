import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos, intente en 1 minuto' },
  standardHeaders: true,
  legacyHeaders: false,
});
