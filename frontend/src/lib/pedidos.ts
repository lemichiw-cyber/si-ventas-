/**
 * Pedidos locales (GitHub Pages no tiene servidor).
 *
 * El pedido se guarda en el navegador con un ID (DE-XXXXXX) y se envía por
 * WhatsApp con todos los datos ya escritos. Si algún día vuelve a existir
 * una API, solo hay que cambiar `crearPedido` y `buscarPedido`.
 */
import { calcularEnvio, enlaceWhatsApp } from './tienda';

const CLAVE_PEDIDOS = 'dulce-pedidos';

export interface LineaPedido {
  product_id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  imagen?: string;
}

export interface ClientePedido {
  nombre: string;
  telefono: string;
  departamento: string;
  municipio: string;
  direccion: string;
  referencia: string;
  metodo: string;
  notas: string;
}

export interface Pedido {
  id: string;
  creado: string;
  estado: 'recibido' | 'preparando' | 'enviado' | 'entregado';
  items: LineaPedido[];
  subtotal: number;
  envio: number;
  total: number;
  cliente: ClientePedido;
}

function leer(): Pedido[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CLAVE_PEDIDOS) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function escribir(pedidos: Pedido[]) {
  try {
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos.slice(0, 20)));
  } catch {
    /* almacenamiento lleno o modo privado */
  }
}

function nuevoId(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let sufijo = '';
  for (let i = 0; i < 6; i++) sufijo += abc[Math.floor(Math.random() * abc.length)];
  return `DE-${sufijo}`;
}

export function crearPedido(items: LineaPedido[], cliente: ClientePedido): Pedido {
  const subtotal = items.reduce((a, i) => a + i.precio * i.cantidad, 0);
  const envio = calcularEnvio(subtotal);
  const pedido: Pedido = {
    id: nuevoId(),
    creado: new Date().toISOString(),
    estado: 'recibido',
    items,
    subtotal,
    envio,
    total: subtotal + envio,
    cliente,
  };
  escribir([pedido, ...leer()]);
  return pedido;
}

export function buscarPedido(id: string): Pedido | null {
  const limpio = id.trim().toUpperCase();
  return leer().find(p => p.id === limpio || p.id.replace('DE-', '') === limpio) ?? null;
}

export function pedidosRecientes(): Pedido[] {
  return leer().slice(0, 5);
}

/** Mensaje de WhatsApp listo para enviar con el pedido completo. */
export function mensajePedido(p: Pedido): string {
  const lineas = p.items.map(i => `• ${i.cantidad}x ${i.nombre} — $${(i.precio * i.cantidad).toFixed(2)}`).join('\n');
  return [
    `Hola, Dulce Encanto 🍓 Quiero confirmar este pedido:`,
    '',
    `Pedido: ${p.id}`,
    `Cliente: ${p.cliente.nombre}`,
    `Teléfono: ${p.cliente.telefono}`,
    `Entrega: ${p.cliente.municipio}, ${p.cliente.departamento}`,
    `Dirección: ${p.cliente.direccion}`,
    p.cliente.referencia ? `Referencia: ${p.cliente.referencia}` : '',
    `Pago: ${p.cliente.metodo}`,
    '',
    lineas,
    '',
    `Subtotal: $${p.subtotal.toFixed(2)}`,
    p.envio === 0 ? 'Envío: gratis 🎉' : `Envío: $${p.envio.toFixed(2)}`,
    `Total: $${p.total.toFixed(2)}`,
    p.cliente.notas ? `\nNotas: ${p.cliente.notas}` : '',
    '',
    'Confirmen por favor 💌',
  ]
    .filter(Boolean)
    .join('\n');
}

export function enlacePedidoWhatsApp(p: Pedido): string {
  return enlaceWhatsApp(mensajePedido(p));
}

export const ESTADOS: Record<Pedido['estado'], { label: string; paso: number }> = {
  recibido: { label: 'Pedido recibido', paso: 0 },
  preparando: { label: 'En preparación', paso: 1 },
  enviado: { label: 'Enviado', paso: 2 },
  entregado: { label: 'Entregado', paso: 3 },
};
