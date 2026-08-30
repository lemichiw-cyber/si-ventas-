import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { Login, Register } from './pages/Auth';
import Admin from './pages/Admin';
import Novedades from './pages/Novedades';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="min-h-[60vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:slug" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/novedades" element={<Novedades />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<div className="p-12 text-center">404 - No encontrado 🥺</div>} />
        </Routes>
      </main>
      <footer className="bg-white border-t border-pink-100 mt-12 py-8 text-center text-sm text-gray-500">
        <p className="font-script text-lg text-morado-oscuro">Dulce Encanto 👑🍓</p>
        <p className="mt-1">Una explosión de sabor natural en cada cucharada. ¡Hechas con amor y fruta fresca!</p>
        <p className="mt-2 text-xs">© 2026 Dulce Encanto - Mermeladas Artesanales. Hecho con 💖</p>
      </footer>
    </BrowserRouter>
  );
}
