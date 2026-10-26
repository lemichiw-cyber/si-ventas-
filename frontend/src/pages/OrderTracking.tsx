import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ESTADOS, buscarPedido, pedidosRecientes, enlacePedidoWhatsApp, type Pedido } from '../lib/pedidos';
import { WHATSAPP_GENERAL, CONTACTO } from '../lib/tienda';

const PASOS = [
  { key: 'recibido', label: 'Pedido recibido' },
  { key: 'preparando', label: 'En preparación' },
  { key: 'enviado', label: 'Enviado' },
  { key: 'entregado', label: 'Entregado' },
];

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [buscado, setBuscado] = useState('');
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);

  const recientes = pedidosRecientes();

  const buscar = (valor: string) => {
    setBuscado(valor);
    const encontrado = valor.trim() ? buscarPedido(valor) : null;
    setPedido(encontrado);
    setNoEncontrado(Boolean(valor.trim()) && !encontrado);
  };

  const pasoActual = pedido ? ESTADOS[pedido.estado].paso : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-script text-4xl text-morado-oscuro text-center mb-2">Seguimiento de Pedido 📦</h1>
      <p className="text-center text-sm text-gray-500 mb-8">
        Tus pedidos se guardan en este navegador, así que no necesitas cuenta.
        ¿Pediste por WhatsApp y no tienes el ID? Escríbenos al{' '}
        <a href={`tel:${CONTACTO.telefono}`} className="text-rosa-pastel font-semibold">{CONTACTO.telefonoVisible}</a>.
      </p>

      <form
        onSubmit={e => { e.preventDefault(); buscar(orderId); }}
        className="flex gap-2 max-w-md mx-auto mb-8"
      >
        <input
          value={orderId}
          onChange={e => setOrderId(e.target.value)}
          placeholder="ID de tu pedido (ej: DE-7K2M)"
          className="flex-1 border border-pink-100 rounded-full px-4 py-2 outline-none focus:border-lila"
          required
          aria-label="ID del pedido"
        />
        <button type="submit" className="bg-gradient-to-r from-rosa-pastel to-lila text-white px-6 py-2 rounded-full font-semibold">
          Buscar
        </button>
      </form>

      {noEncontrado && (
        <div className="bg-white rounded-[24px] border border-pink-100 shadow-soft p-8 text-center mb-8">
          <p className="text-4xl">🔍</p>
          <h2 className="font-script text-2xl text-morado-oscuro mt-3">No encontramos el pedido {buscado}</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Revisa el ID (empieza con <span className="font-mono">DE-</span>) o contáctanos por WhatsApp con tu nombre y teléfono.
          </p>
          <a href={WHATSAPP_GENERAL} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 bg-gradient-to-r from-rosa-pastel to-lila text-white px-6 py-2.5 rounded-full font-semibold">
            Consultar por WhatsApp 💬
          </a>
        </div>
      )}

      {pedido && (
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-semibold text-morado-oscuro">Estado del envío</h3>
              <span className="font-mono text-sm text-gray-500">{pedido.id}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {PASOS.map((step, idx) => {
                const activo = idx <= pasoActual;
                return (
                  <div key={step.key} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all ${activo ? 'bg-gradient-to-r from-rosa-pastel to-lila scale-110' : 'bg-gray-200 text-gray-500'}`}>
                      {idx + 1}
                    </div>
                    <span className={`text-sm ${activo ? 'text-morado-oscuro font-semibold' : 'text-gray-400'}`}>{step.label}</span>
                    {idx < PASOS.length - 1 && <div className={`h-0.5 w-8 sm:w-12 ${idx < pasoActual ? 'bg-gradient-to-r from-rosa-pastel to-lila' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>

            <div className="bg-lavanda-blush rounded-2xl p-4 text-sm text-morado-oscuro space-y-1">
              <p><strong>Estado actual:</strong> {ESTADOS[pedido.estado].label}</p>
              <p><strong>Cliente:</strong> {pedido.cliente.nombre} · {pedido.cliente.telefono}</p>
              <p><strong>Entrega:</strong> {pedido.cliente.direccion}, {pedido.cliente.municipio}, {pedido.cliente.departamento}</p>
              <p><strong>Pago:</strong> {pedido.cliente.metodo}</p>
              <p className="text-xs text-gray-500 pt-1">
                Este estado lo controlamos por WhatsApp: escríbenos con el ID para actualizarlo.
              </p>
            </div>

            <a href={enlacePedidoWhatsApp(pedido)} target="_blank" rel="noopener noreferrer" className="block text-center mt-4 bg-gradient-to-r from-rosa-pastel to-lila text-white py-2.5 rounded-full font-semibold">
              Consultar este pedido por WhatsApp 💬
            </a>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
            <h3 className="font-semibold text-morado-oscuro mb-3">Tu pedido</h3>
            <div className="divide-y divide-pink-50 text-sm">
              {pedido.items.map(i => (
                <div key={i.product_id} className="flex justify-between py-2 gap-3">
                  <span>{i.cantidad}x {i.nombre}</span>
                  <span className="font-semibold">${(i.precio * i.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2"><span>Envío {pedido.envio === 0 ? '(gratis 🎉)' : ''}</span><span>${pedido.envio.toFixed(2)}</span></div>
              <div className="flex justify-between py-2 font-bold text-morado-oscuro"><span>Total</span><span>${pedido.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}

      {!pedido && !noEncontrado && recientes.length > 0 && (
        <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
          <h3 className="font-semibold text-morado-oscuro mb-3">Tus pedidos recientes 💜</h3>
          <ul className="divide-y divide-pink-50 text-sm">
            {recientes.map(p => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-mono">{p.id}</span>
                <span className="text-gray-500">{new Date(p.creado).toLocaleDateString('es-SV')}</span>
                <span className="font-semibold">${p.total.toFixed(2)}</span>
                <span className="bg-lavanda-blush text-morado-oscuro px-3 py-1 rounded-full text-xs">{ESTADOS[p.estado].label}</span>
                <button onClick={() => { setOrderId(p.id); buscar(p.id); }} className="text-rosa-pastel font-medium">Ver →</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!pedido && !noEncontrado && recientes.length === 0 && (
        <div className="bg-white rounded-[24px] p-10 text-center shadow-soft border border-pink-50">
          <p className="text-5xl">🍓</p>
          <h2 className="font-script text-2xl text-morado-oscuro mt-3">Aún no tienes pedidos aquí</h2>
          <p className="text-gray-500 mt-2 text-sm">Cuando hagas un pedido en este navegador aparecerá su ID y podrás seguirlo.</p>
          <Link to="/catalogo" className="inline-block mt-5 bg-gradient-to-r from-rosa-pastel to-lila text-white px-6 py-2.5 rounded-full font-semibold">Ir al Catálogo</Link>
        </div>
      )}
    </div>
  );
}
