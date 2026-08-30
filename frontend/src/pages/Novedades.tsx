import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function Novedades() {
  const { data } = useQuery({ queryKey: ['novedades-page'], queryFn: async () => (await api.get('/products?novedades=true')).data });
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-script text-4xl text-morado-oscuro">Novedades ✨</h1>
      <p className="text-gray-500">Nuevos sabores artesanales, recetas y temporadas</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {data?.data?.map((p: any, i: number) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
      <div className="mt-12 bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
        <h3 className="font-semibold text-morado-oscuro">Blog / Recetas (mock)</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="border-b pb-2"><span className="font-semibold">Receta:</span> Tostadas con Mermelada de Fresa y queso crema 🍓 — combina tu fresa artesanal con pan brioche.</li>
          <li className="border-b pb-2"><span className="font-semibold">Temporada:</span> Mora silvestre de verano, ¡aprovecha stock limitado!</li>
          <li><span className="font-semibold">Nuevo:</span> Mixta Fresa-Mora, edición limitada con corazón dorado 👑</li>
        </ul>
      </div>
    </div>
  );
}
