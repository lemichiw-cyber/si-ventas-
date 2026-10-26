import { useQuery } from '@tanstack/react-query';
import { listarProductos } from '../lib/catalog';
import ProductCard from '../components/ProductCard';

export default function Novedades() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['novedades-page'],
    queryFn: () => listarProductos({ novedades: true }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-script text-4xl text-morado-oscuro">Novedades ✨</h1>
      <p className="text-gray-500">Nuevos sabores artesanales, recetas y temporadas</p>

      {isPending && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 animate-pulse" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white rounded-[24px] shadow-soft overflow-hidden border border-pink-50">
              <div className="h-52 bg-lavanda-blush" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-lavanda-blush rounded-full w-3/4" />
                <div className="h-8 bg-lavanda-blush rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-[24px] border border-pink-100 shadow-soft p-10 text-center mt-8">
          <p className="text-4xl">🫠</p>
          <h2 className="font-script text-2xl text-morado-oscuro mt-3">No pudimos cargar las novedades</h2>
          <p className="text-gray-500 mt-2">Recarga la página o contáctanos por WhatsApp.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {data.map((p: any, i: number) => (
            <ProductCard key={p.id} p={p} index={i} />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="bg-white rounded-[24px] border border-pink-50 shadow-soft p-10 text-center mt-8">
          <p className="text-4xl">🌱</p>
          <h2 className="font-script text-2xl text-morado-oscuro mt-3">Estamos cocinando algo nuevo</h2>
          <p className="text-gray-500 mt-2">Cuando salga la próxima edición limitada la anunciamos aquí y por WhatsApp.</p>
        </div>
      )}

      <div className="mt-12 bg-white rounded-[24px] p-6 shadow-soft border border-pink-50">
        <h3 className="font-semibold text-morado-oscuro">Blog / Recetas</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="border-b pb-2"><span className="font-semibold">Receta:</span> Tostadas con Mermelada de Fresa y queso crema 🍓 — combina tu fresa artesanal con pan brioche.</li>
          <li className="border-b pb-2"><span className="font-semibold">Temporada:</span> Mora silvestre de verano, ¡aprovecha stock limitado!</li>
          <li><span className="font-semibold">Nuevo:</span> Mixta Fresa-Mora, edición limitada con corazón dorado 👑</li>
        </ul>
      </div>
    </div>
  );
}
