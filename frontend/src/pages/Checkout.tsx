import { useCart } from '../store/useCart';
import { useAuth } from '../store/useAuth';
import api from '../lib/api';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [direccion, setDireccion] = useState('');
  const [metodo, setMetodo] = useState('mock');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const nav = useNavigate();

  if (!user) return <div className="max-w-xl mx-auto px-4 py-16 text-center"><p className="text-morado-oscuro">Debes iniciar sesión para pagar</p><Link to="/login" className="inline-block mt-4 bg-morado-oscuro text-white px-6 py-2 rounded-full">Ir a Login</Link></div>;
  if (orderId) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center bg-white rounded-[32px] shadow-soft border border-pink-50">
      <p className="text-6xl">🎉</p>
      <h2 className="font-script text-3xl text-morado-oscuro mt-4">¡Compra confirmada!</h2>
      <p className="text-gray-500 mt-2">
        Tu orden <span className="font-mono font-bold">{orderId.slice(0, 8)}</span> está en camino 💌
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Guarda este ID para hacer seguimiento de tu pedido.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <button onClick={() => nav('/catalogo')} className="bg-gradient-to-r from-rosa-pastel to-lila text-white px-8 py-3 rounded-full font-semibold">
          Seguir comprando
        </button>
        <Link
          to={`/tracking`}
          className="border border-pink-200 text-morado-oscuro px-8 py-3 rounded-full font-semibold hover:bg-lavanda-blush transition"
        >
          📦 Hacer seguimiento
        </Link>
      </div>
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        items: items.map(i => ({ productId: i.product_id, cantidad: i.cantidad })),
        direccionEnvio: direccion,
        metodoPago: metodo,
      });
      setOrderId(res.data.id);
      clear();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear orden');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
        <h1 className="font-script text-3xl text-morado-oscuro">Checkout 💳</h1>
        <form onSubmit={submit} className="space-y-4 mt-6">
          <input value={direccion} onChange={e => setDireccion(e.target.value)} required placeholder="Dirección de envío completa" className="w-full border-2 border-dashed border-pink-200 rounded-full px-4 py-3 outline-none focus:border-lila" />
          <select value={metodo} onChange={e => setMetodo(e.target.value)} className="w-full border border-pink-100 rounded-full px-4 py-3">
            <option value="mock">Simulación (Mock) ✨</option><option value="stripe">Stripe Sandbox (simulado)</option><option value="paypal">PayPal Sandbox (simulado)</option>
          </select>
          <div className="bg-lavanda-blush rounded-2xl p-4 text-sm text-morado-oscuro">
            <p>🔒 Pago seguro simulado. No se cobrará tarjeta real. Se usa encriptación AES-256 para tu dirección.</p>
          </div>
          <button disabled={loading || items.length===0} className="w-full bg-gradient-to-r from-rosa-pastel to-lila text-white py-3 rounded-full font-semibold disabled:opacity-50">{loading ? 'Procesando...' : `Pagar $${(total()+2.5).toFixed(2)}`}</button>
        </form>
      </div>
      <div className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50 h-fit">
        <h3 className="font-semibold">Resumen de Orden</h3>
        <div className="divide-y divide-pink-50 mt-4">
          {items.map(i => <div key={i.product_id} className="flex justify-between py-2 text-sm"><span>{i.nombre} x{i.cantidad}</span><span>${(i.precio_snapshot*i.cantidad).toFixed(2)}</span></div>)}
        </div>
        <div className="flex justify-between font-bold mt-4"><span>Total + envío</span><span>${(total()+2.5).toFixed(2)}</span></div>
      </div>
    </div>
  );
}
