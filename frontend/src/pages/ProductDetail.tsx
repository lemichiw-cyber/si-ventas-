import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { obtenerProducto, guardarResena } from '../lib/catalog';
import { useCart } from '../store/useCart';
import { useState } from 'react';
import ProductCard from '../components/ProductCard';
import FallbackImg from '../components/FallbackImg';
import { WHATSAPP_GENERAL } from '../lib/tienda';

export default function ProductDetail() {
  const { slug } = useParams();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'nutricion' | 'ingredientes' | 'beneficios' | 'resenas'>('nutricion');
  const [mensajeResena, setMensajeResena] = useState('');
  const add = useCart(s => s.addItem);
  const qc = useQueryClient();

  const { data: p, isPending, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => obtenerProducto(String(slug)),
  });

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse" aria-hidden="true">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-[420px] bg-lavanda-blush rounded-[24px]" />
          <div className="space-y-4">
            <div className="h-6 bg-lavanda-blush rounded-full w-1/3" />
            <div className="h-10 bg-lavanda-blush rounded-full w-2/3" />
            <div className="h-4 bg-lavanda-blush rounded-full w-full" />
            <div className="h-12 bg-lavanda-blush rounded-full w-1/2" />
          </div>
        </div>
        <p className="sr-only">Cargando producto…</p>
      </div>
    );
  }

  if (isError || !p) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl">🧁</p>
        <h1 className="font-script text-3xl text-morado-oscuro mt-4">No encontramos esa mermelada</h1>
        <p className="text-gray-500 mt-2">Puede que se haya agotado o que el enlace haya cambiado.</p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Link to="/catalogo" className="bg-gradient-to-r from-rosa-pastel to-lila text-white px-6 py-3 rounded-full font-semibold">Ver Catálogo</Link>
          <a href={WHATSAPP_GENERAL} target="_blank" rel="noopener noreferrer" className="border border-pink-200 text-morado-oscuro px-6 py-3 rounded-full font-semibold hover:bg-lavanda-blush transition">Preguntar por WhatsApp 💬</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-400 mb-4" aria-label="Migas de pan">
        <Link to="/" className="hover:text-rosa-pastel">Inicio</Link> /{' '}
        <Link to="/catalogo" className="hover:text-rosa-pastel">Catálogo</Link> /{' '}
        <span className="text-morado-oscuro">{p.nombre}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 bg-white rounded-[32px] p-6 shadow-soft border border-pink-50">
        <div>
          <FallbackImg src={p.imagenPrincipal || ''} alt={p.nombre} className="w-full h-[420px] object-cover rounded-[24px] hover:scale-[1.02] transition" loading="eager" />
          <div className="flex gap-2 mt-3">
            {(p.imagenesGaleria || []).slice(0, 3).map((img: string, i: number) => <FallbackImg key={i} src={img || ''} alt={`Galería ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border border-pink-50" loading="lazy" />)}
          </div>
        </div>
        <div>
          <span className="inline-block bg-lavanda-blush text-morado-oscuro text-xs px-3 py-1 rounded-full">{p.categoria?.nombre}</span>
          <h1 className="font-script text-4xl text-morado-oscuro mt-3">{p.nombre}</h1>
          <p className="text-gray-500 mt-2">{p.descripcion}</p>
          <p className="text-3xl font-bold text-morado-oscuro mt-4">
            ${p.precio.toFixed(2)}{' '}
            <span className="text-sm font-normal text-gray-400">{p.pesoNeto} · Quedan {p.stock} frascos</span>
          </p>

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <div className="flex items-center border border-pink-100 rounded-full overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2 hover:bg-lavanda-blush" aria-label="Quitar una unidad">−</button>
              <span className="px-4 font-semibold" aria-live="polite">{qty}</span>
              <button onClick={() => setQty(q => Math.min(p.stock, q + 1))} className="px-4 py-2 hover:bg-lavanda-blush" aria-label="Añadir una unidad">+</button>
            </div>
            <button
              onClick={() => {
                add({ product_id: p.id, cantidad: qty, precio_snapshot: p.precio, nombre: p.nombre, imagen: p.imagenPrincipal });
                const el = document.getElementById('cart-feedback');
                if (el) { el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 1800); }
              }}
              className="flex-1 min-w-[200px] bg-gradient-to-r from-rosa-pastel to-lila text-white py-3 rounded-full font-semibold shadow-pink hover:scale-[1.02] transition"
            >
              Agregar al Carrito 🛒
            </button>
          </div>
          <p id="cart-feedback" className="hidden mt-3 bg-green-50 text-green-700 text-sm px-4 py-2 rounded-full text-center">¡Agregado con amor! 💖</p>
          <p className="text-xs text-gray-400 mt-3">🚚 Envío gratis desde $25 · Entrega en 24-48 h hábiles</p>

          {/* Tabs */}
          <div className="mt-8">
            <div className="flex gap-2 border-b border-pink-100 pb-2 overflow-x-auto">
              {[
                ['nutricion', 'Nutrición'],
                ['ingredientes', 'Ingredientes'],
                ['beneficios', 'Beneficios'],
                ['resenas', `Reseñas (${p.reviews?.length || 0})`],
              ].map(([k, label]) => (
                <button key={k} onClick={() => setTab(k as any)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${tab === k ? 'bg-gradient-to-r from-rosa-pastel to-lila text-white' : 'bg-lavanda-blush text-morado-oscuro'}`}>{label}</button>
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
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-morado-oscuro">{r.autor || r.user?.nombre || 'Anónimo'}</span>
                        <span className="text-dorado" aria-label={`${r.rating} de 5 estrellas`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{r.comentario}</p>
                    </div>
                  ))}
                  {(!p.reviews || p.reviews.length === 0) && <p className="text-sm text-gray-400">Aún no hay reseñas. ¡Sé la primera!</p>}

                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      const fd = new FormData(e.target as HTMLFormElement);
                      const comentario = String(fd.get('comentario') || '').trim();
                      if (!comentario) return;
                      guardarResena(p.id, Number(fd.get('rating')), comentario, String(fd.get('autor') || ''));
                      qc.invalidateQueries({ queryKey: ['product', slug] });
                      setMensajeResena('¡Gracias! Tu reseña ya está aquí 💖');
                      (e.target as HTMLFormElement).reset();
                    }}
                    className="bg-lavanda-blush p-4 rounded-2xl mt-4"
                  >
                    <p className="text-sm font-semibold text-morado-oscuro">Dejar reseña (se guarda en tu dispositivo)</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <select name="rating" className="border rounded-full px-3 py-2 text-sm" aria-label="Puntuación">
                        <option value="5">5 ★</option><option value="4">4 ★</option><option value="3">3 ★</option><option value="2">2 ★</option><option value="1">1 ★</option>
                      </select>
                      <input name="autor" placeholder="Tu nombre" className="w-32 border rounded-full px-3 py-2 text-sm" aria-label="Tu nombre" />
                      <input name="comentario" placeholder="Tu comentario dulce..." className="flex-1 min-w-[160px] border rounded-full px-3 py-2 text-sm" required aria-label="Comentario" />
                      <button className="bg-morado-oscuro text-white px-4 py-2 rounded-full text-sm">Enviar</button>
                    </div>
                    {mensajeResena && <p className="text-xs text-green-700 mt-2" role="status">{mensajeResena}</p>}
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
