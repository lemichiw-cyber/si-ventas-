import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Home() {
  const { data } = useQuery({
    queryKey: ['products', 'home'],
    queryFn: async () => (await api.get('/products?limit=8&recomendados=true')).data,
  });
  const novedades = useQuery({
    queryKey: ['novedades'],
    queryFn: async () => (await api.get('/products?novedades=true')).data,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-lavanda-blush via-white to-fondo">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="inline-block bg-white border border-pink-100 px-3 py-1 rounded-full text-xs text-morado-oscuro">Hechas con amor & fruta fresca 🍓</span>
            <h1 className="font-script text-5xl md:text-6xl text-morado-oscuro mt-4 leading-tight">Una explosión de sabor natural <span className="text-rosa-pastel">en cada cucharada</span></h1>
            <p className="text-gray-500 mt-4 text-lg">Mermeladas artesanales, sin conservadores. ¡Pura fruta, puro encanto!</p>
            <div className="flex gap-3 mt-6">
              <Link to="/catalogo" className="bg-gradient-to-r from-rosa-pastel to-lila text-white px-8 py-3 rounded-full font-semibold shadow-pink hover:scale-105 transition">Ver Catálogo →</Link>
              <Link to="/novedades" className="bg-white border border-pink-100 px-6 py-3 rounded-full font-medium">Novedades</Link>
            </div>
            <div className="flex gap-6 mt-8 text-sm text-morado-oscuro">
              <span>💜 100% Natural</span><span>✨ Artesanal</span><span>🍯 Con amor</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <img src="https://images.unsplash.com/photo-1700166581152-5489eb689333?w=700&q=80" alt="Frasco de mermelada artesanal con fresas" className="rounded-[32px] shadow-soft w-full object-cover h-[420px]" />
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute -bottom-6 -left-6 bg-white p-4 rounded-3xl shadow-pink border border-pink-50">
              <p className="text-sm text-gray-500">Más vendido</p><p className="font-semibold text-morado-oscuro">Fresa Artesanal 🍓</p><p className="text-rosa-pastel font-bold">$2.50</p>
            </motion.div>
            <div className="absolute -top-4 -right-4 text-4xl animate-bounce">🍓</div>
            <div className="absolute top-1/2 -right-2 text-3xl">🫐</div>
          </motion.div>
        </div>
        {/* decor frutas cayendo */}
        <div className="absolute inset-0 pointer-events-none opacity-10 text-4xl select-none">
          <span className="absolute left-10 top-10">🍓</span><span className="absolute right-20 top-20">🍑</span><span className="absolute left-1/2 bottom-10">🫐</span>
        </div>
      </section>

      {/* Compromiso */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
        {[
          { icon: '🌿', title: 'Calidad Natural', desc: 'Fruta fresca seleccionada, sin conservadores artificiales.' },
          { icon: '💖', title: 'Hechas con Cuidado', desc: 'Cocción lenta y amor en cada frasco, estilo kawaii artesanal.' },
          { icon: '👑', title: 'Sabor Encantado', desc: 'Recetas premiadas que enamoran a toda la familia.' },
        ].map(c => (
          <div key={c.title} className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50 text-center">
            <div className="text-4xl">{c.icon}</div><h3 className="font-semibold text-morado-oscuro mt-2">{c.title}</h3><p className="text-sm text-gray-500 mt-1">{c.desc}</p>
          </div>
        ))}
      </section>

      {/* Destacados */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h2 className="font-script text-3xl text-morado-oscuro">Recomendados 💜</h2>
          <Link to="/catalogo" className="text-rosa-pastel font-medium">Ver todo →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {data?.data?.map((p: any, i: number) => <ProductCard key={p.id} p={p} index={i} />)}
          {!data && <p className="text-gray-400">Cargando delicias...</p>}
        </div>
      </section>

      {/* Novedades */}
      {novedades.data?.data?.length > 0 && (
        <section className="bg-gradient-to-r from-rosa-pastel/20 via-lila/20 to-dorado/10 border-y border-pink-100 py-10 mt-8">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="font-script text-3xl text-morado-oscuro text-center">¡Novedades! ✨</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 max-w-4xl mx-auto">
              {novedades.data.data.map((p: any, i: number) => <ProductCard key={p.id} p={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Testimonios */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-script text-3xl text-morado-oscuro text-center">Lo que dicen nuestras clientas</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {[
            { name: 'Valentina R.', text: 'La de zarzamora es magia pura, ¡no puedo parar! 💜', stars: 5 },
            { name: 'Camila S.', text: 'Se nota lo artesanal, sabor casero y presentación kawaii hermosa.', stars: 5 },
            { name: 'Lucía M.', text: 'La mixta fresa-mora es mi favorita, mis niños la aman.', stars: 5 },
          ].map(t => (
            <div key={t.name} className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
              <div className="text-dorado">{'★'.repeat(t.stars)}</div>
              <p className="text-sm text-gray-600 mt-2">"{t.text}"</p>
              <p className="text-xs text-morado-oscuro font-semibold mt-3">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-rosa-pastel to-lila rounded-[32px] p-8 text-white text-center shadow-pink">
          <h3 className="font-script text-3xl">Únete al club Dulce Encanto 💌</h3>
          <p className="opacity-90 mt-2">Recibe recetas y descuentos pastel</p>
          <form onSubmit={e => { e.preventDefault(); alert('¡Gracias por suscribirte! (mock)'); }} className="flex gap-2 mt-6 max-w-md mx-auto">
            <input placeholder="tu email kawaii..." className="flex-1 px-4 py-3 rounded-full text-morado-oscuro outline-none" />
            <button className="bg-white text-morado-oscuro px-6 py-3 rounded-full font-semibold">Suscribirme</button>
          </form>
        </div>
      </section>
    </div>
  );
}
