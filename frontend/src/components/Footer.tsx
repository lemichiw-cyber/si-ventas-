import { CONTACTO, WHATSAPP_GENERAL } from '../lib/tienda';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-pink-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm text-gray-500">
        <div>
          <p className="font-script text-xl text-morado-oscuro">Dulce Encanto 👑🍓</p>
          <p className="mt-2 leading-relaxed">
            Una explosión de sabor natural en cada cucharada. ¡Hechas con amor y fruta fresca!
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-morado-oscuro mb-2">Tienda</h3>
          <ul className="space-y-1">
            <li><Link to="/catalogo" className="hover:text-rosa-pastel transition">Catálogo completo</Link></li>
            <li><Link to="/novedades" className="hover:text-rosa-pastel transition">Novedades ✨</Link></li>
            <li><Link to="/carrito" className="hover:text-rosa-pastel transition">Tu carrito 🛒</Link></li>
            <li><Link to="/tracking" className="hover:text-rosa-pastel transition">Seguimiento de pedido 📦</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-morado-oscuro mb-2">Contacto</h3>
          <ul className="space-y-1">
            <li>
              <a href={`tel:${CONTACTO.telefono}`} className="hover:text-rosa-pastel transition">{CONTACTO.telefonoVisible}</a>
            </li>
            <li>
              <a href={WHATSAPP_GENERAL} target="_blank" rel="noopener noreferrer" className="hover:text-rosa-pastel transition">
                WhatsApp 💬 (respondemos rápido)
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACTO.email}`} className="hover:text-rosa-pastel transition break-all">{CONTACTO.email}</a>
            </li>
            <li>
              <a href={CONTACTO.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-rosa-pastel transition">
                Instagram 📸
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-morado-oscuro mb-2">Envíos</h3>
          <p>Entrega en todo El Salvador en 24-48 h hábiles (San Salvador y zona metropolitana).</p>
          <p className="mt-2">🚚 <strong className="text-morado-oscuro">Envío gratis</strong> en pedidos desde $25.</p>
          <p className="mt-2">Pago contra entrega o transferencia.</p>
        </div>
      </div>

      <div className="border-t border-pink-50 py-4 text-center text-xs text-gray-400">
        © 2026 Dulce Encanto — Mermeladas Artesanales · Hecho con 💖 por{' '}
        <a href="https://github.com/lemichiw-cyber" target="_blank" rel="noopener noreferrer" className="text-rosa-pastel">Sakura Enterprise</a>
      </div>
    </footer>
  );
}
