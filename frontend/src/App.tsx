import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Novedades from './pages/Novedades';
import OrderTracking from './pages/OrderTracking';
import { WHATSAPP_GENERAL } from './lib/tienda';

export default function App() {
  return (
    <BrowserRouter basename={(import.meta as any).env.VITE_BASE || '/'}>
      <Navbar />
      <main className="min-h-[60vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:slug" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/novedades" element={<Novedades />} />
          <Route path="/tracking" element={<OrderTracking />} />
          <Route
            path="*"
            element={
              <div className="p-16 text-center">
                <p className="text-6xl">🥺</p>
                <h1 className="font-script text-3xl text-morado-oscuro mt-4">404 — Esta página se comió la mermelada</h1>
                <div className="flex flex-wrap gap-3 justify-center mt-6">
                  <Link to="/catalogo" className="bg-gradient-to-r from-rosa-pastel to-lila text-white px-6 py-3 rounded-full font-semibold">
                    Ir al Catálogo
                  </Link>
                  <a href={WHATSAPP_GENERAL} target="_blank" rel="noopener noreferrer" className="border border-pink-200 text-morado-oscuro px-6 py-3 rounded-full font-semibold hover:bg-lavanda-blush transition">
                    Escribir por WhatsApp 💬
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
