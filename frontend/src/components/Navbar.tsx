import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/useCart';
import { useAuth } from '../store/useAuth';
import { motion } from 'framer-motion';

export default function Navbar() {
  const count = useCart(s => s.count());
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍓</span>
          <span className="font-script text-2xl text-morado-oscuro">Dulce Encanto</span>
          <span className="text-dorado text-xl">👑</span>
        </Link>
        <div className="hidden md:flex gap-6 font-medium text-morado-oscuro">
          <Link to="/" className="hover:text-rosa-pastel transition">Inicio</Link>
          <Link to="/catalogo" className="hover:text-rosa-pastel transition">Catálogo</Link>
          <Link to="/novedades" className="hover:text-rosa-pastel transition">Novedades</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/carrito" className="relative bg-gradient-to-r from-rosa-pastel to-lila text-white px-4 py-2 rounded-full font-semibold shadow-pink hover:scale-105 transition">
            🛒 Carrito
            {count > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-dorado text-morado-oscuro text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                {count}
              </motion.span>
            )}
          </Link>
          {user ? (
            <>
              <span className="text-sm text-morado-oscuro hidden sm:inline">{user.nombre} ({user.rol})</span>
              {user.rol === 'admin' && <Link to="/admin" className="text-sm bg-morado-oscuro text-white px-3 py-1 rounded-full">Admin</Link>}
              <button onClick={() => { logout(); nav('/'); }} className="text-sm border border-pink-200 px-3 py-1 rounded-full">Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-morado-oscuro">Login</Link>
              <Link to="/registro" className="text-sm bg-lavanda-blush px-4 py-2 rounded-full">Registro</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
