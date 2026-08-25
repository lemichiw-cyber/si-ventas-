import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(__dirname, '..');
export const PUBLICO = path.join(RAIZ, 'public');

function cargarEnv() {
  const archivo = path.join(RAIZ, '.env');
  if (!fs.existsSync(archivo)) return;
  for (const linea of fs.readFileSync(archivo, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !linea.trim().startsWith('#') && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
cargarEnv();

const num = (v, def) => (v !== undefined && v !== '' ? Number(v) : def);
const bool = (v, def) => (v === undefined || v === '' ? def : String(v).toLowerCase() !== 'false');

export const CONFIG = {
  PUERTO: num(process.env.PUERTO ?? process.env.PORT, 3000),
  DB_ARCHIVO: process.env.DB_ARCHIVO || path.join(RAIZ, 'data', 'dulce-encanto.db'),
  // Acepta JWT_SECRETO o JWT_SECRET. Si falta, genera uno EFÍMERO (las sesiones
  // se invalidan al reiniciar) con aviso en consola — el deploy nunca se cae.
  JWT_SECRETO: (() => {
    const secreto = process.env.JWT_SECRETO || process.env.JWT_SECRET;
    if (secreto) return secreto;
    const generado = crypto.randomBytes(32).toString('hex');
    const aviso = [
      '',
      '╔══════════════════════════════════════════════════════════╗',
      '║  ⚠️  JWT_SECRETO no definido — usando secreto EFÍMERO     ║',
      '║  Las sesiones se cerrarán cada vez que reinicies.        ║',
      '║  Define la variable en tu panel para persistencia.       ║',
      '╚══════════════════════════════════════════════════════════╝'
    ].join('\n');
    console.log(aviso);
    return generado;
  })(),
  TOKEN_HORAS: num(process.env.TOKEN_HORAS, 168),
  IVA: num(process.env.IVA, 0.15),
  COSTO_ENVIO: num(process.env.COSTO_ENVIO, 1.5),
  ENVIO_GRATIS_DESDE: num(process.env.ENVIO_GRATIS_DESDE, 15),
  EMAIL: {
    DE: process.env.EMAIL_DE || 'Dulce Encanto <pedidos@dulceencanto.com>',
    ADMIN_EMAIL: process.env.EMAIL_ADMIN || 'duena@dulceencanto.com',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    SMTP_URL: process.env.SMTP_URL || '',
    SIMULADO: bool(process.env.EMAIL_SIMULADO, true)
  },
  MONEDA: {
    codigo: process.env.MONEDA_CODIGO || 'USD',
    simbolo: process.env.MONEDA_SIMBOLO || '$',
    posicion: process.env.MONEDA_POSICION || 'antes'   // antes | despues
  },
  CATALOGO_SIN_VENTA: bool(process.env.CATALOGO_SIN_VENTA, false),
  // Pagos con tarjeta (sandbox-ready): activa la opción en checkout
  STRIPE_ENABLED: bool(process.env.STRIPE_ENABLED, false),
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  // Métodos de pago aceptados (validación server-side)
  METODOS_PAGO: ['efectivo', 'transferencia', 'tarjeta'],
  NEGOCIO: {
    nombre: 'Dulce Encanto',
    eslogan: 'Una explosión de sabor natural en cada cucharada. ¡Hechas con amor y fruta fresca!',
    telefono: '+593 99 123 4567',
    direccion: 'Av. de las Flores 123, Quito',
    horario: 'Lunes a sábado, 9:00 – 18:00'
  }
};
