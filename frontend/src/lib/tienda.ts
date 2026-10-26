/**
 * Datos comerciales de la tienda: contacto, envío y constantes.
 * Todo en un solo lugar para poder editar sin buscar por el código.
 */

export const CONTACTO = {
  /** Solo dígitos, con prefijo de país (usado en wa.me). */
  whatsapp: '50379980884',
  telefono: '+50379980884',
  telefonoVisible: '+503 7998 0884',
  email: 'sakuraenterprise2@gmail.com',
  instagram: 'https://www.instagram.com/sakura_enterprise2/',
};

export const ENVIO = {
  /** Costo fijo del envío en USD. */
  costo: 2.5,
  /** A partir de este monto el envío es gratis. */
  gratisDesde: 25,
};

/** Devuelve el costo de envío para un subtotal dado. */
export function calcularEnvio(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= ENVIO.gratisDesde ? 0 : ENVIO.costo;
}

export const DEPARTAMENTOS = [
  'Ahuachapán', 'Cabañas', 'Chalatenango', 'Cuscatlán', 'La Libertad', 'La Paz',
  'La Unión', 'Morazán', 'San Miguel', 'San Salvador', 'San Vicente', 'Santa Ana',
  'Sonsonate', 'Usulután',
];

export const METODOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo contra entrega 💵' },
  { id: 'tarjeta', label: 'Tarjeta contra entrega 💳' },
  { id: 'transferencia', label: 'Transferencia (Daviplata / Bacredomatic) 📲' },
];

/** Construye el enlace de WhatsApp con un mensaje ya escrito. */
export function enlaceWhatsApp(mensaje: string): string {
  return `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

/** Enlace genérico de contacto (sin mensaje). */
export const WHATSAPP_GENERAL = `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(
  'Hola, Dulce Encanto 🍓 Quiero hacer un pedido de mermeladas artesanales.'
)}`;
