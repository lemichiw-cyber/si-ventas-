import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { hashPassword, verifyPassword, encrypt, decrypt } from '../utils/crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { validate } from '../middleware/validate';
import { loginLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    nombre: z.string().min(1).max(50),
    apellido: z.string().min(1).max(50),
    telefono: z.string().optional(),
    direccion: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, password, nombre, apellido, telefono, direccion } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email ya registrado' });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nombre,
      apellido,
      telefono: telefono ? encrypt(telefono) : null,
      direccion: direccion ? encrypt(direccion) : null,
      rol: 'cliente',
    },
  });

  const payload = { userId: user.id, email: user.email, rol: user.rol };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 7*24*60*60*1000 });
  res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', maxAge: 15*60*1000 });

  res.status(201).json({ user: { id: user.id, email: user.email, nombre, apellido, rol: user.rol }, accessToken, refreshToken });
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const payload = { userId: user.id, email: user.email, rol: user.rol };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 7*24*60*60*1000 });
  res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', maxAge: 15*60*1000 });
  res.json({ user: { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, rol: user.rol }, accessToken, refreshToken });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', maxAge: 15*60*1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 7*24*60*60*1000 });
    res.json({ accessToken, refreshToken });
  } catch {
    res.status(401).json({ error: 'Refresh inválido' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logout ok' });
});

router.post('/forgot-password', async (req, res) => {
  // mock: siempre responde ok
  res.json({ message: 'Si el email existe, se envió instrucciones (mock)' });
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: 'No encontrado' });
  res.json({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    telefono: user.telefono ? decrypt(user.telefono) : null,
    direccion: user.direccion ? decrypt(user.direccion) : null,
    rol: user.rol,
  });
});

router.put('/me', authenticate, async (req: AuthRequest, res) => {
  const { nombre, apellido, telefono, direccion } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(nombre && { nombre }),
      ...(apellido && { apellido }),
      ...(telefono && { telefono: encrypt(telefono) }),
      ...(direccion && { direccion: encrypt(direccion) }),
    },
  });
  res.json({ message: 'Perfil actualizado', user: { id: updated.id, email: updated.email } });
});

export default router;
