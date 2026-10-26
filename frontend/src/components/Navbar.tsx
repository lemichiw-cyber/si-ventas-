import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../store/useCart';
import { WHATSAPP_GENERAL } from '../lib/tienda';

const ENLACES = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/novedades', label: 'Novedades' },
  { to: '/tracking', label: '📦 Seguimiento' },
];

export default function Navbar() {
  const count = useCart(s => s.count());
  const [abierto, setAbierto] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  // Al cambiar de página el menú se cierra (sobre todo en móvil).
  useEffect(() => { setAbierto(false); }, [pathname]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        botonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [abierto]);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Dulce Encanto, ir al inicio">
          <span className="text-2xl" aria-hidden="true">🍓</span>
          <span className="font-script text-lg sm:text-2xl text-morado-oscuro">Dulce Encanto</span>
          <span className="hidden sm:inline text-dorado text-xl" aria-hidden="true">👑</span>
        </Link>

        <div className="hidden md:flex gap-6 font-medium text-morado-oscuro">
          {ENLACES.map(e => (
            <NavLink key={e.to} to={e.to} end={e.to === '/'} className={({ isActive }) => `transition hover:text-rosa-pastel ${isActive ? 'text-rosa-pastel' : ''}`}>
              {e.label}
            </NavLink>
          ))}
          <a href={WHATSAPP_GENERAL} target="_blank" rel="noopener noreferrer" className="text-morado-oscuro hover:text-rosa-pastel transition">
            WhatsApp
          </a>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/carrito"
            className="relative shrink-0 bg-gradient-to-r from-rosa-pastel to-lila text-white px-3 sm:px-4 py-2 rounded-full font-semibold shadow-pink hover:scale-105 transition"
          >
            🛒 <span className="hidden sm:inline">Carrito</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-dorado text-morado-oscuro text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
            <span className="sr-only">{count} productos en el carrito</span>
          </Link>

          <button
            ref={botonRef}
            type="button"
            onClick={() => setAbierto(a => !a)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            className="md:hidden inline-flex flex-col justify-center gap-1.5 w-11 h-11 items-center rounded-xl border border-pink-200 bg-white"
          >
            <span className="sr-only">{abierto ? 'Cerrar menú' : 'Abrir menú'}</span>
            <span aria-hidden="true" className={`block w-5 h-0.5 bg-morado-oscuro transition-transform ${abierto ? 'translate-y-2 rotate-45' : ''}`} />
            <span aria-hidden="true" className={`block w-5 h-0.5 bg-morado-oscuro transition-opacity ${abierto ? 'opacity-0' : ''}`} />
            <span aria-hidden="true" className={`block w-5 h-0.5 bg-morado-oscuro transition-transform ${abierto ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {abierto && (
        <div id="menu-movil" className="md:hidden border-t border-pink-100 bg-white px-4 pb-4 pt-2">
          <ul className="flex flex-col gap-1 font-medium text-morado-oscuro">
            {ENLACES.map(e => (
              <li key={e.to}>
                <NavLink
                  to={e.to}
                  end={e.to === '/'}
                  onClick={() => setAbierto(false)}
                  className={({ isActive }) => `block rounded-full px-4 py-2.5 transition ${isActive ? 'bg-lavanda-blush text-rosa-pastel' : 'hover:bg-lavanda-blush'}`}
                >
                  {e.label}
                </NavLink>
              </li>
            ))}
            <li>
              <a
                href={WHATSAPP_GENERAL}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-full px-4 py-2.5 bg-gradient-to-r from-rosa-pastel to-lila text-white font-semibold text-center mt-1"
              >
                Pedir por WhatsApp 💬
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
