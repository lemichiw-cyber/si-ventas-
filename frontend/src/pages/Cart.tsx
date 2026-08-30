import { useCart } from '../store/useCart';
import { Link, useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, updateQty, removeItem, total } = useCart();
  const navigate = useNavigate();
  const shipping = items.length ? 2.5 : 0;

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-6xl">🛒</p><h2 className="font-script text-3xl text-morado-oscuro mt-4">Tu carrito está vacío</h2>
      <p className="text-gray-500 mt-2">¡Llena tu vida de dulzor!</p>
      <Link to="/catalogo" className="inline-block mt-6 bg-gradient-to-r from-rosa-pastel to-lila text-white px-8 py-3 rounded-full font-semibold">Ir al Catálogo</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-script text-4xl text-morado-oscuro">Tu Carrito 💜</h1>
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 space-y-3">
          {items.map(i => (
            <div key={i.product_id} className="bg-white rounded-[20px] p-4 flex gap-4 shadow-soft border border-pink-50">
              <img src={i.imagen || 'https://via.placeholder.com/100'} alt={i.nombre} className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-medium text-morado-oscuro">{i.nombre || i.product_id.slice(0,8)}</p>
                <p className="text-sm text-gray-400">${i.precio_snapshot.toFixed(2)} c/u</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQty(i.product_id, i.cantidad - 1)} className="w-8 h-8 rounded-full border border-pink-100">−</button>
                  <span className="w-8 text-center font-semibold">{i.cantidad}</span>
                  <button onClick={() => updateQty(i.product_id, i.cantidad + 1)} className="w-8 h-8 rounded-full border border-pink-100">+</button>
                  <span className="ml-auto font-bold">${(i.precio_snapshot * i.cantidad).toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => removeItem(i.product_id)} className="text-pink-300 hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50 h-fit">
          <h3 className="font-semibold text-morado-oscuro">Resumen</h3>
          <div className="space-y-2 text-sm mt-4">
            <div className="flex justify-between"><span>Subtotal</span><span>${total().toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Envío estimado</span><span>${shipping.toFixed(2)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold text-morado-oscuro"><span>Total</span><span>${(total() + shipping).toFixed(2)}</span></div>
          </div>
          <button onClick={() => navigate('/checkout')} className="w-full mt-6 bg-gradient-to-r from-rosa-pastel to-lila text-white py-3 rounded-full font-semibold">Continuar al Pago →</button>
          <Link to="/catalogo" className="block text-center text-sm text-rosa-pastel mt-3">← Seguir comprando</Link>
        </div>
      </div>
    </div>
  );
}
