import crypto from 'node:crypto';
import { CONFIG } from './config.js';

export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verificarPassword(plain, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const calculado = crypto.scryptSync(String(plain), salt, 64);
  const original = Buffer.from(hash, 'hex');
  return original.length === calculado.length && crypto.timingSafeEqual(original, calculado);
}

function firma(data) {
  return crypto.createHmac('sha256', CONFIG.JWT_SECRETO).update(data).digest('base64url');
}

export function firmarToken(payload, horas = CONFIG.TOKEN_HORAS) {
  const cuerpo = { ...payload, exp: Math.floor(Date.now() / 1000) + horas * 3600 };
  const data = Buffer.from(JSON.stringify(cuerpo)).toString('base64url');
  return `${data}.${firma(data)}`;
}

export function verificarToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(firma(data));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function usuarioDePeticion(req, query = {}) {
  const cabecera = req.headers['authorization'] || '';
  const bearer = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
  const token = bearer || query.token || '';
  const payload = verificarToken(token);
  if (!payload) return null;
  return { id: payload.id, rol: payload.rol, nombre: payload.nombre };
}
