import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Home() {
  const { data: featured } = useQuery({
    queryKey: ['products', 'home'],
    queryFn: async () => (await api.get('/products?limit=8&recomendados=true')).data,
  });
  const { data: novedades } = useQuery({
    queryKey: ['novedades'],
    queryFn: async () => (await api.get('/products?novedades=true')).data,
  });

  const trustBar = [
    { icon: '🚚', title: 'Envío Gratis', desc: 'A partir de $500 MXN' },
    { icon: '⚡', title: 'Entrega Rápida', desc: '24-48h hábiles' },
    { icon: '🌿', title: '100% Natural', desc: 'Sin conservadores' },
    { icon: '🔒', title: 'Pago Seguro', desc: 'AES-256 encriptado' },
    { icon: '💯', title: 'Garantía', desc: 'Satisfacción o reembolsamos' },
  ];

  const benefits = [
    { icon: '🍓', title: 'Fruta Fresca', desc: 'Seleccionamos la mejor fruta de temporada para cada lote.' },
    { icon: '🍯', title: 'Cocción Lenta', desc: 'Nuestra receta secreta de cocción lenta realza el sabor natural.' },
    { icon: '🌱', title: 'Sin Conservadores', desc: 'Cero aditivos, cero químicos. Solo fruta y azúcar natural.' },
    { icon: '👑', title: 'Recetas Premiadas', desc: 'Las mismas recetas que han ganado reconocimiento en ferias artesanales.' },
  ];

  const testimonials = [
    { name: 'Valentina R.', text: 'La de zarzamora es magia pura, ¡no puedo parar! 💜', stars: 5 },
    { name: 'Camila S.', text: 'Se nota lo artesanal, sabor casero y presentación kawaii hermosa.', stars: 5 },
    { name: 'Lucía M.', text: 'La mixta fresa-mora es mi favorita, mis niños la aman.', stars: 5 },
    { name: 'Sofía P.', text: 'Llegó en 24h y el empaquetado era precioso. ¡Volveré a comprar!', stars: 5 },
    { name: 'María G.', text: 'Desde que probé estas mermeladas, nada más me sirve. ¡Excelente!', stars: 5 },
  ];

  const faqs = [
    {
      q: '¿Cuánto tarda el envío?',
      a: 'En pedidos dentro de la CDMX y zonas metropolitanas, la entrega es de 24-48 horas hábiles. En el resto del país, 3-5 días hábiles.',
    },
    {
      q: '¿Son realmente sin conservadores?',
      a: 'Sí. Nuestras mermeladas están hechas con fruta fresca, azúcar y un toque de limón. No utilizamos ningún conservador artificial, colorante ni saborizante.',
    },
    {
      q: '¿Qué métodos de pago aceptan?',
      a: 'Aceptamos tarjetas de crédito/déébito (Stripe y PayPal) y contraentrega en la entrega.',
    },
    {
      q: '¿Puedo personalizar mi pedido?',
      a: '¡Claro! Escríbenos por WhatsApp y coordinamos presentaciones especiales, surtidos o notas personalizadas.',
    },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
              <Link
                to="/catalogo"
                className="bg-gradient-to-r from-rosa-pastel to-lila text-white px-8 py-3 rounded-full font-semibold shadow-pink hover:scale-105 transition"
              >
                Ver Catálogo →
              </Link>
              <Link
                to="/novedades"
                className="bg-white border border-pink-100 px-6 py-3 rounded-full font-medium hover:bg-lavanda-blush transition"
              >
                Novedades
              </Link>
            </div>

            {/* Stock urgency badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 bg-dorado/10 border border-dorado/30 text-morado-oscuro px-4 py-2 rounded-full mt-6 text-sm font-medium"
            >
              <span className="w-2 h-2 bg-dorado rounded-full animate-pulse"></span>
              Edición limitada Mixta Fresa-Mora 👑 — Solo 45 unidades
            </motion.div>

            <div className="flex gap-6 mt-8 text-sm text-morado-oscuro">
              <span>💜 100% Natural</span>
              <span>✨ Artesanal</span>
              <span>🍯 Con amor</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1700166581152-5489eb689333?w=700&q=80"
              alt="Frasco de mermelada artesanal con fresas"
              className="rounded-[32px] shadow-soft w-full object-cover h-[420px]"
              loading="eager"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -bottom-6 -left-6 bg-white p-4 rounded-3xl shadow-pink border border-pink-50"
            >
              <p className="text-sm text-gray-500">Más vendido</p>
              <p className="font-semibold text-morado-oscuro">Fresa Artesanal 🍓</p>
              <p className="text-rosa-pastel font-bold">$2.50</p>
            </motion.div>
            <div className="absolute -top-4 -right-4 text-4xl animate-bounce">🍓</div>
            <div className="absolute top-1/2 -right-2 text-3xl">🫐</div>
          </motion.div>
        </div>
        {/* decor frutas */}
        <div className="absolute inset-0 pointer-events-none opacity-10 text-4xl select-none">
          <span className="absolute left-10 top-10">🍓</span>
          <span className="absolute right-20 top-20">🍑</span>
          <span className="absolute left-1/2 bottom-10">🫐</span>
          <span className="absolute right-10 bottom-20">🍓</span>
        </div>
      </section>

      {/* TrustBar */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {trustBar.map((t) => (
            <div
              key={t.title}
              className="bg-white rounded-[20px] p-4 shadow-soft border border-pink-50 text-center"
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <p className="font-semibold text-morado-oscuro text-sm">{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compromiso */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
        {[
          { icon: '🌿', title: 'Calidad Natural', desc: 'Fruta fresca seleccionada, sin conservadores artificiales.' },
          { icon: '💖', title: 'Hechas con Cuidado', desc: 'Cocción lenta y amor en cada frasco, estilo kawaii artesanal.' },
          { icon: '👑', title: 'Sabor Encantado', desc: 'Recetas premiadas que enamoran a toda la familia.' },
        ].map((c) => (
          <div
            key={c.title}
            className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50 text-center"
          >
            <div className="text-4xl">{c.icon}</div>
            <h3 className="font-semibold text-morado-oscuro mt-2">{c.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
          </div>
        ))}
      </section>

      {/* Beneficios */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="font-script text-3xl text-morado-oscuro">Por qué elegir Dulce Encanto 💜</h2>
          <p className="text-gray-500 mt-2">La combinación perfecta entre tradición y sabor</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50 text-center transition hover:scale-105"
            >
              <div className="text-4xl mb-3">{b.icon}</div>
              <h3 className="font-semibold text-morado-oscuro mb-1">{b.title}</h3>
              <p className="text-sm text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h2 className="font-script text-3xl text-morado-oscuro">Recomendados 💜</h2>
          <Link to="/catalogo" className="text-rosa-pastel font-medium">
            Ver todo →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {featured?.data?.map((p: any, i: number) => (
            <ProductCard key={p.id} p={p} index={i} />
          ))}
          {!featured && <p className="text-gray-400">Cargando delicias...</p>}
        </div>
        {featured && featured.data?.length === 0 && (
          <p className="text-center text-gray-400 mt-8">No hay productos destacados ahorita. ¡Vuelve pronto!</p>
        )}
      </section>

      {/* Novedades */}
      {novedades?.data?.length > 0 && (
        <section className="bg-gradient-to-r from-rosa-pastel/20 via-lila/20 to-dorado/10 border-y border-pink-100 py-10 mt-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="font-script text-3xl text-morado-oscuro">¡Novedades! ✨</h2>
            <p className="text-gray-500 mt-1">Nuevos sabores artesanales, recetas y temporadas</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 max-w-4xl mx-auto">
              {novedades.data.map((p: any, i: number) => (
                <ProductCard key={p.id} p={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="font-script text-3xl text-morado-oscuro text-center mb-8">Preguntas frecuentes ❓</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={f.q} className="bg-white rounded-[20px] border border-pink-50 shadow-soft overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-morado-oscuro hover:bg-lavanda-blush transition"
              >
                <span>{f.q}</span>
                <motion.span
                  animate={{ rotate: openFaq === i ? 180 : 0 }}
                  className="text-xl transition-transform"
                >
                  ▼
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 pb-4"
                  >
                    <p className="text-sm text-gray-600">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonios */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-script text-3xl text-morado-oscuro text-center">Lo que dicen nuestras clientas 💌</h2>
        <p className="text-center text-gray-500 mt-2 text-sm">4.9/5 ★ de 152 reseñas reales</p>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[24px] p-6 shadow-soft border border-pink-50"
            >
              <div className="text-dorado">{'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}</div>
              <p className="text-sm text-gray-600 mt-2">"{t.text}"</p>
              <p className="text-xs text-morado-oscuro font-semibold mt-3">— {t.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-rosa-pastel to-lila rounded-[32px] p-8 text-white text-center shadow-pink">
          <h3 className="font-script text-3xl">Únete al club Dulce Encanto 💌</h3>
          <p className="opacity-90 mt-2">Recibe recetas, tips de cocina y 10% de descuento en tu primera compra</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('¡Gracias por suscribirte! Te llegará tu código de descuento al email. 💖');
            }}
            className="flex gap-2 mt-6 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-full text-morado-oscuro outline-none"
              required
            />
            <button className="bg-white text-morado-oscuro px-6 py-3 rounded-full font-semibold">
              Suscribirme
            </button>
          </form>
        </div>
      </section>

      {/* Floating WhatsApp Chat */}
      <motion.a
        href="https://wa.me/5215551234567?text=Quiero%20pedir%20mermeladas%20de%20Dulce%20Encanto%20🍓"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 text-white px-4 py-3 rounded-full shadow-xl hover:scale-105 transition"
        aria-label="WhatsApp"
      >
        <span className="text-2xl">💬</span>
        <span className="hidden sm:inline font-medium">WhatsApp</span>
      </motion.a>
    </div>
  );
}
