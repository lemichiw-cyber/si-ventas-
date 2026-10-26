import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/useCart';
import { DEPARTAMENTOS, METODOS_PAGO, calcularEnvio, ENVIO } from '../lib/tienda';
import { crearPedido, enlacePedidoWhatsApp, type Pedido } from '../lib/pedidos';

export default function Checkout() {
  const { items, total, clear } = useCart();
  const nav = useNavigate();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [departamento, setDepartamento] = useState('San Salvador');
  const [municipio, setMunicipio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [metodo, setMetodo] = useState(METODOS_PAGO[0].label);
  const [notas, setNotas] = useState('');
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [enlacesAbiertos, setEnlacesAbiertos] = useState(false);

  const subtotal = total();
  const envio = calcularEnvio(subtotal);

  if (items.length === 0 && !pedido) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl">🛒</p>
        <h1 className="font-script text-3xl text-morado-oscuro mt-4">Tu carrito está vacío</h1>
        <p className="text-gray-500 mt-2">Añade mermeladas antes de hacer el pedido 🍓</p>
        <Link to="/catalogo" className="inline-block mt-6 bg-gradient-to-r from-rosa-pastel to-lila text-white px-8 py-3 rounded-full font-semibold">Ir al Catálogo</Link>
      </div>
    );
  }

  // Confirmación: el pedido queda guardado en este dispositivo y se envía por WhatsApp.
  if (pedido) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-[32px] p-8 shadow-soft border border-pink-50 text-center">
          <p className="text-6xl">🎉</p>
          <h1 className="font-script text-3xl text-morado-oscuro mt-4">¡Tu pedido está listo!</h1>
          <p className="text-gray-500 mt-2">
            Guarda este ID: <span className="font-mono font-bold text-morado-oscuro">{pedido.id}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Te falta solo enviarlo: al pulsar el botón se abre WhatsApp con el pedido ya escrito.
          </p>

          <div className="bg-lavanda-blush rounded-2xl p-4 mt-6 text-left text-sm text-morado-oscuro space-y-1">
            {pedido.items.map(i => (
              <div key={i.product_id} className="flex justify-between gap-3">
                <span>{i.cantidad}x {i.nombre}</span>
                <span className="font-semibold">${(i.precio * i.cantidad).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-pink-100 pt-2 mt-2 font-bold">
              <span>Envío {pedido.envio === 0 ? '(gratis 🎉)' : ''}</span>
              <span>${pedido.envio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${pedido.total.toFixed(2)}</span></div>
            <p className="text-xs text-gray-500 pt-1">
              {pedido.cliente.nombre} · {pedido.cliente.telefono} · {pedido.cliente.municipio}, {pedido.cliente.departamento}
            </p>
          </div>

          {enlacesAbiertos && (
            <p className="text-xs text-gray-500 mt-3" role="status">
              Si la ventana de WhatsApp no se abrió, usa el botón de arriba o el de correo.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <a
              id="btn-pedido-whatsapp"
              href={enlacePedidoWhatsApp(pedido)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setEnlacesAbiertos(true)}
              className="bg-gradient-to-r from-rosa-pastel to-lila text-white px-8 py-3 rounded-full font-semibold shadow-pink"
            >
              Enviar pedido por WhatsApp 💬
            </a>
            <button
              onClick={() => nav('/catalogo')}
              className="border border-pink-200 text-morado-oscuro px-8 py-3 rounded-full font-semibold hover:bg-lavanda-blush transition"
            >
              Seguir comprando
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Guarda el ID del pedido: te servirá para dar seguimiento 📦
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
        <h1 className="font-script text-3xl text-morado-oscuro">Datos de entrega 💌</h1>
        <p className="text-sm text-gray-500 mt-1">Sin registro ni tarjeta: confirmamos el pedido por WhatsApp.</p>

        <form
          onSubmit={e => {
            e.preventDefault();
            const nuevo = crearPedido(
              items.map(i => ({ product_id: i.product_id, nombre: i.nombre || 'Mermelada', cantidad: i.cantidad, precio: i.precio_snapshot, imagen: i.imagen })),
              { nombre, telefono, departamento, municipio, direccion, referencia, metodo, notas }
            );
            setPedido(nuevo);
            clear();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="space-y-4 mt-6"
        >
          <div>
            <label htmlFor="co-nombre" className="text-sm font-medium text-morado-oscuro">Nombre completo *</label>
            <input id="co-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Ana Pérez" className="w-full border-2 border-dashed border-pink-200 rounded-full px-4 py-3 outline-none focus:border-lila mt-1" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="co-tel" className="text-sm font-medium text-morado-oscuro">Teléfono / WhatsApp *</label>
              <input id="co-tel" value={telefono} onChange={e => setTelefono(e.target.value)} required inputMode="tel" placeholder="Ej: 7998-0884" className="w-full border border-pink-100 rounded-full px-4 py-3 outline-none focus:border-lila mt-1" />
            </div>
            <div>
              <label htmlFor="co-dep" className="text-sm font-medium text-morado-oscuro">Departamento *</label>
              <select id="co-dep" value={departamento} onChange={e => setDepartamento(e.target.value)} className="w-full border border-pink-100 rounded-full px-4 py-3 mt-1">
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="co-mun" className="text-sm font-medium text-morado-oscuro">Municipio *</label>
              <input id="co-mun" value={municipio} onChange={e => setMunicipio(e.target.value)} required placeholder="Ej: San Salvador" className="w-full border border-pink-100 rounded-full px-4 py-3 outline-none focus:border-lila mt-1" />
            </div>
            <div>
              <label htmlFor="co-dir" className="text-sm font-medium text-morado-oscuro">Dirección completa *</label>
              <input id="co-dir" value={direccion} onChange={e => setDireccion(e.target.value)} required placeholder="Calle, colonia, #casa" className="w-full border border-pink-100 rounded-full px-4 py-3 outline-none focus:border-lila mt-1" />
            </div>
          </div>

          <div>
            <label htmlFor="co-ref" className="text-sm font-medium text-morado-oscuro">Referencia para el repartidor</label>
            <input id="co-ref" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej: Portón verde, frente al parque" className="w-full border border-pink-100 rounded-full px-4 py-3 outline-none focus:border-lila mt-1" />
          </div>

          <div>
            <label htmlFor="co-metodo" className="text-sm font-medium text-morado-oscuro">Método de pago</label>
            <select id="co-metodo" value={metodo} onChange={e => setMetodo(e.target.value)} className="w-full border border-pink-100 rounded-full px-4 py-3 mt-1">
              {METODOS_PAGO.map(m => <option key={m.id} value={m.label}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="co-notas" className="text-sm font-medium text-morado-oscuro">Notas del pedido</label>
            <textarea id="co-notas" value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Ej: regalo, envolver con lazo, horario preferido..." className="w-full border border-pink-100 rounded-2xl px-4 py-3 outline-none focus:border-lila mt-1" />
          </div>

          <div className="bg-lavanda-blush rounded-2xl p-4 text-sm text-morado-oscuro">
            <p>🔒 Sin pago en línea: el repartidor cobra en tu puerta (o confirmamos la transferencia por WhatsApp).</p>
            <p className="mt-1">🚚 {envio === 0 ? 'Tu envío es gratis 🎉' : `Envío $${ENVIO.costo.toFixed(2)} — gratis desde $${ENVIO.gratisDesde}`}</p>
          </div>

          <button
            className="w-full bg-gradient-to-r from-rosa-pastel to-lila text-white py-3 rounded-full font-semibold shadow-pink hover:scale-[1.01] transition"
          >
            Confirmar pedido — ${(subtotal + envio).toFixed(2)} 💜
          </button>
          <p className="text-xs text-gray-400 text-center">Al confirmar guardamos el pedido en tu navegador y abrimos WhatsApp.</p>
        </form>
      </div>

      <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50 h-fit">
        <h3 className="font-semibold text-morado-oscuro">Resumen de tu pedido</h3>
        <div className="divide-y divide-pink-50 mt-4">
          {items.map(i => (
            <div key={i.product_id} className="flex justify-between py-2 text-sm gap-3">
              <span>{i.nombre} x{i.cantidad}</span>
              <span className="font-semibold">${(i.precio_snapshot * i.cantidad).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-sm mt-4">
          <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Envío</span><span>{envio === 0 ? '¡Gratis! 🎉' : `$${envio.toFixed(2)}`}</span></div>
          <div className="border-t pt-2 flex justify-between font-bold text-morado-oscuro text-lg"><span>Total</span><span>${(subtotal + envio).toFixed(2)}</span></div>
        </div>
        <Link to="/carrito" className="block text-center text-sm text-rosa-pastel mt-4">← Editar carrito</Link>
      </div>
    </div>
  );
}
