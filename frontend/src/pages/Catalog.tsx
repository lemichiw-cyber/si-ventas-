import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [sort, setSort] = useState('');
  const [novedades, setNovedades] = useState(false);
  const [precioMax, setPrecioMax] = useState('');

  const query = useQuery({
    queryKey: ['catalog', search, categoria, sort, novedades, precioMax],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoria) params.set('categoria', categoria);
      if (sort) params.set('sort', sort);
      if (novedades) params.set('novedades', 'true');
      if (precioMax) params.set('precio_max', precioMax);
      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-script text-4xl text-morado-oscuro">Catálogo 🍓</h1>
      <p className="text-gray-500 mt-1">Explora todas nuestras mermeladas artesanales</p>

      <div className="bg-white rounded-[24px] p-4 shadow-soft border border-pink-50 flex flex-wrap gap-3 mt-6">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar fresa, mora..." className="flex-1 min-w-[200px] border border-pink-100 rounded-full px-4 py-2 outline-none focus:border-lila" />
        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border border-pink-100 rounded-full px-4 py-2">
          <option value="">Todas las frutas</option>
          <option value="fresa">Fresa</option><option value="mora">Mora</option><option value="durazno">Durazno</option><option value="zarzamora">Zarzamora</option><option value="mixtas">Mixtas</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="border border-pink-100 rounded-full px-4 py-2">
          <option value="">Ordenar</option><option value="precio_asc">Precio ↑</option><option value="precio_desc">Precio ↓</option><option value="popular">Popular</option>
        </select>
        <select value={precioMax} onChange={e => setPrecioMax(e.target.value)} className="border border-pink-100 rounded-full px-4 py-2">
          <option value="">Precio máx</option><option value="2.6">$2.60</option><option value="3">$3.00</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={novedades} onChange={e => setNovedades(e.target.checked)} /> Solo novedades</label>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {query.data?.data?.map((p: any, i: number) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
      {query.data?.data?.length === 0 && <p className="text-center text-gray-400 mt-12">No se encontraron productos con esos filtros 🥺</p>}
    </div>
  );
}
