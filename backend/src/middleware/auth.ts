import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const tokenFromCookie = (req as any).cookies?.accessToken;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : tokenFromCookie;

  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function authorizeAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.rol !== 'admin') return res.status(403).json({ error: 'Requiere rol admin' });
  next();
}
