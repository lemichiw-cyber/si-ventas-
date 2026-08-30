import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../store/useCart';
import api from '../lib/api';

export default function ProductCard({ p, index = 0 }: { p: any; index?: number }) {
  const add = useCart(s => s.addItem);
  const handleAdd = async () => {
    add({ product_id: p.id, cantidad: 1, precio_snapshot: p.precio, nombre: p.nombre, imagen: p.imagenPrincipal });
    try {
      await api.post('/cart/items', { productId: p.id, cantidad: 1 });
    } catch {}
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ scale: 1.03, boxShadow: '0 12px 32px rgba(255,183,197,0.4)' }}
      className="bg-white rounded-[24px] shadow-soft overflow-hidden border border-pink-50 flex flex-col"
    >
      <div className="relative">
        <img src={p.imagenPrincipal || 'https://via.placeholder.com/400'} alt={p.nombre} loading="lazy" className="w-full h-52 object-cover" />
        {p.esNovedad && <span className="absolute top-3 left-3 bg-gradient-to-r from-rosa-pastel to-lila text-white text-xs font-bold px-3 py-1 rounded-full shadow">¡Nuevo! ✨</span>}
        {p.esRecomendado && !p.esNovedad && <span className="absolute top-3 left-3 bg-dorado text-morado-oscuro text-xs font-bold px-3 py-1 rounded-full">★ Recomendado</span>}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-morado-oscuro text-xs px-2 py-1 rounded-full">{p.categoria?.nombre || ''}</span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-morado-oscuro line-clamp-2">{p.nombre}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{p.descripcion}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-morado-oscuro">${p.precio.toFixed(2)}</span>
          <span className="text-xs text-gray-400">{p.pesoNeto}</span>
        </div>
        <div className="flex gap-2 mt-4">
          <Link to={`/producto/${p.slug}`} className="flex-1 text-center border border-lila text-morado-oscuro py-2 rounded-full text-sm font-medium hover:bg-lavanda-blush transition">Ver</Link>
          <button onClick={handleAdd} className="flex-1 bg-gradient-to-r from-rosa-pastel to-lila text-white py-2 rounded-full text-sm font-semibold hover:scale-[1.02] transition">Agregar 🛒</button>
        </div>
      </div>
    </motion.div>
  );
}
