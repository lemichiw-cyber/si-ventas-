import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useCart } from '../store/useCart';
import { useState } from 'react';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { slug } = useParams();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'nutricion' | 'ingredientes' | 'beneficios' | 'resenas'>('nutricion');
  const add = useCart(s => s.addItem);

  const { data: p, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await api.get(`/products/${slug}`)).data,
  });

  const reviewMutation = useMutation({
    mutationFn: async (body: any) => (await api.post('/reviews', body)).data,
  });

  if (isLoading) return <p className="p-8 text-center">Cargando...</p>;
  if (!p) return <p className="p-8 text-center">No encontrado</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 bg-white rounded-[32px] p-6 shadow-soft border border-pink-50">
        <div>
          <img src={p.imagenPrincipal} alt={p.nombre} className="w-full h-[420px] object-cover rounded-[24px] hover:scale-[1.02] transition" />
          <div className="flex gap-2 mt-3">
            {(p.imagenesGaleria || []).slice(0, 3).map((img: string, i: number) => <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded-xl border border-pink-50" />)}
          </div>
        </div>
        <div>
          <span className="inline-block bg-lavanda-blush text-morado-oscuro text-xs px-3 py-1 rounded-full">{p.categoria?.nombre}</span>
          <h1 className="font-script text-4xl text-morado-oscuro mt-3">{p.nombre}</h1>
          <p className="text-gray-500 mt-2">{p.descripcion}</p>
          <p className="text-3xl font-bold text-morado-oscuro mt-4">${p.precio.toFixed(2)} <span className="text-sm font-normal text-gray-400">{p.pesoNeto} · Stock: {p.stock}</span></p>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center border border-pink-100 rounded-full overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2 hover:bg-lavanda-blush">−</button>
              <span className="px-4 font-semibold">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-4 py-2 hover:bg-lavanda-blush">+</button>
            </div>
            <button
              onClick={async () => {
                add({ product_id: p.id, cantidad: qty, precio_snapshot: p.precio, nombre: p.nombre, imagen: p.imagenPrincipal });
                try { await api.post('/cart/items', { productId: p.id, cantidad: qty }); } catch {}
                // bounce feedback
                const el = document.getElementById('cart-feedback');
                if (el) { el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 1800); }
              }}
              className="flex-1 bg-gradient-to-r from-rosa-pastel to-lila text-white py-3 rounded-full font-semibold shadow-pink hover:scale-[1.02] transition"
            >
              Agregar al Carrito 🛒
            </button>
          </div>
          <p id="cart-feedback" className="hidden mt-3 bg-green-50 text-green-700 text-sm px-4 py-2 rounded-full text-center">¡Agregado con amor! 💖</p>

          {/* Tabs */}
          <div className="mt-8">
            <div className="flex gap-2 border-b border-pink-100 pb-2">
              {[
                ['nutricion', 'Nutrición'],
                ['ingredientes', 'Ingredientes'],
                ['beneficios', 'Beneficios'],
                ['resenas', `Reseñas (${p.reviews?.length || 0})`],
              ].map(([k, label]) => (
                <button key={k} onClick={() => setTab(k as any)} className={`px-4 py-2 rounded-full text-sm font-medium ${tab === k ? 'bg-gradient-to-r from-rosa-pastel to-lila text-white' : 'bg-lavanda-blush text-morado-oscuro'}`}>{label}</button>
              ))}
            </div>
            <div className="mt-4">
              {tab === 'nutricion' && p.nutrition && (
                <div className="bg-fondo rounded-2xl p-4 border border-pink-50">
                  <h4 className="font-semibold text-morado-oscuro">Información Nutricional (por {p.nutrition.porcion})</h4>
                  <table className="w-full text-sm mt-3">
                    <tbody className="divide-y divide-pink-50">
                      <tr><td className="py-1">Calorías</td><td className="text-right font-semibold">{p.nutrition.calorias}</td></tr>
                      <tr><td className="py-1">Proteínas</td><td className="text-right">{p.nutrition.proteinas}g</td></tr>
                      <tr><td className="py-1">Grasas</td><td className="text-right">{p.nutrition.grasas}g</td></tr>
                      <tr><td className="py-1">Carbohidratos</td><td className="text-right">{p.nutrition.carbohidratos}g</td></tr>
                      <tr><td className="py-1">Azúcares</td><td className="text-right">{p.nutrition.azucares}g</td></tr>
                      <tr><td className="py-1">Sodio</td><td className="text-right">{p.nutrition.sodio}mg</td></tr>
                      <tr><td className="py-1">Fibra</td><td className="text-right">{p.nutrition.fibra}g</td></tr>
                      <tr><td className="py-1 font-semibold">% Fruta natural</td><td className="text-right font-bold text-rosa-pastel">{p.nutrition.porcentajeFruta}%</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
              {tab === 'ingredientes' && (
                <ul className="space-y-2">
                  {(p.ingredientes || []).map((ing: string) => (
                    <li key={ing} className="bg-white border border-pink-50 rounded-full px-4 py-2 text-sm flex items-center gap-2"><span>🍓</span> {ing}</li>
                  ))}
                </ul>
              )}
              {tab === 'beneficios' && (
                <ul className="space-y-2">
                  {(p.beneficios || []).map((b: string) => (
                    <li key={b} className="bg-white border border-pink-50 rounded-full px-4 py-2 text-sm flex items-center gap-2"><span>✨</span> {b}</li>
                  ))}
                </ul>
              )}
              {tab === 'resenas' && (
                <div className="space-y-3">
                  {p.reviews?.map((r: any) => (
                    <div key={r.id} className="bg-white border border-pink-50 rounded-2xl p-3">
                      <div className="flex justify-between"><span className="font-medium text-morado-oscuro">{r.user?.nombre || 'Anónimo'}</span><span className="text-dorado">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
                      <p className="text-sm text-gray-600 mt-1">{r.comentario}</p>
                    </div>
                  ))}
                  {p.reviews?.length === 0 && <p className="text-sm text-gray-400">Aún no hay reseñas. ¡Sé la primera!</p>}
                  <form onSubmit={async e => {
                    e.preventDefault();
                    const fd = new FormData(e.target as HTMLFormElement);
                    try {
                      await reviewMutation.mutateAsync({ productId: p.id, rating: Number(fd.get('rating')), comentario: String(fd.get('comentario')) });
                      alert('¡Reseña enviada! Gracias 💖');
                      (e.target as HTMLFormElement).reset();
                    } catch (err: any) {
                      alert(err.response?.data?.error || 'Error');
                    }
                  }} className="bg-lavanda-blush p-4 rounded-2xl mt-4">
                    <p className="text-sm font-semibold text-morado-oscuro">Dejar reseña (requiere compra verificada)</p>
                    <div className="flex gap-2 mt-2">
                      <select name="rating" className="border rounded-full px-3 py-2 text-sm"><option value="5">5 ★</option><option value="4">4 ★</option><option value="3">3 ★</option><option value="2">2 ★</option><option value="1">1 ★</option></select>
                      <input name="comentario" placeholder="Tu comentario dulce..." className="flex-1 border rounded-full px-3 py-2 text-sm" />
                      <button className="bg-morado-oscuro text-white px-4 py-2 rounded-full text-sm">Enviar</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {p.related?.length > 0 && (
        <div className="mt-12">
          <h3 className="font-script text-2xl text-morado-oscuro">Te puede encantar también 💜</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
            {p.related.map((rp: any, i: number) => <ProductCard key={rp.id} p={rp} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
