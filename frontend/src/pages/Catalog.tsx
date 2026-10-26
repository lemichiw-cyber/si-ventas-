import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIAS, listarProductos } from '../lib/catalog';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

export default function Catalog() {
  // La búsqueda también vive en la URL: /catalogo?search=fresa
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [categoria, setCategoria] = useState('');
  const [sort, setSort] = useState('');
  const [novedades, setNovedades] = useState(false);
  const [precioMax, setPrecioMax] = useState('');

  useEffect(() => {
    const valor = params.get('search') || '';
    setSearch(valor);
  }, [params]);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('search') || '') !== search) {
        setParams(search ? { search } : {}, { replace: true });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search, params, setParams]);

  const query = useQuery({
    queryKey: ['catalog', search, categoria, sort, novedades, precioMax],
    queryFn: () =>
      listarProductos({
        search,
        categoria,
        sort,
        novedades,
        precioMax: precioMax ? Number(precioMax) : undefined,
      }),
  });

  const hayFiltros = Boolean(search || categoria || sort || novedades || precioMax);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-script text-4xl text-morado-oscuro">Catálogo 🍓</h1>
      <p className="text-gray-500 mt-1">Explora todas nuestras mermeladas artesanales</p>

      <div className="bg-white rounded-[24px] p-4 shadow-soft border border-pink-50 mt-6 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar mermelada, fruta, ingrediente..."
          className="flex-1 min-w-[180px] border border-pink-100 rounded-full px-4 py-2 outline-none focus:border-lila"
          aria-label="Buscar productos"
        />
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className="border border-pink-100 rounded-full px-3 py-2"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => (
            <option key={c.slug} value={c.slug}>{c.nombre}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="border border-pink-100 rounded-full px-3 py-2"
          aria-label="Ordenar"
        >
          <option value="">Más populares</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="nombre">Nombre A-Z</option>
        </select>
        <select
          value={precioMax}
          onChange={e => setPrecioMax(e.target.value)}
          className="border border-pink-100 rounded-full px-3 py-2"
          aria-label="Precio máximo"
        >
          <option value="">Cualquier precio</option>
          <option value="2.5">Hasta $2.50</option>
          <option value="2.8">Hasta $2.80</option>
          <option value="3">Hasta $3.00</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-morado-oscuro cursor-pointer select-none">
          <input type="checkbox" checked={novedades} onChange={e => setNovedades(e.target.checked)} className="accent-pink-400" />
          Solo novedades ✨
        </label>
      </div>

      {query.isPending && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-[24px] shadow-soft overflow-hidden border border-pink-50 animate-pulse">
              <div className="h-52 bg-lavanda-blush" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-lavanda-blush rounded-full w-3/4" />
                <div className="h-3 bg-lavanda-blush rounded-full w-full" />
                <div className="h-8 bg-lavanda-blush rounded-full w-1/2" />
              </div>
            </div>
          ))}
          <p className="sr-only">Cargando productos…</p>
        </div>
      )}

      {query.isError && (
        <div className="bg-white rounded-[24px] border border-pink-100 shadow-soft p-10 text-center mt-8">
          <p className="text-4xl">🫠</p>
          <h2 className="font-script text-2xl text-morado-oscuro mt-3">No pudimos cargar el catálogo</h2>
          <p className="text-gray-500 mt-2">Revisa tu conexión y vuelve a intentarlo, o escríbenos por WhatsApp y te ayudamos a elegir.</p>
        </div>
      )}

      {query.data && query.data.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {query.data.map((p: any, i: number) => (
            <ProductCard key={p.id} p={p} index={i} />
          ))}
        </div>
      )}

      {query.data && query.data.length === 0 && (
        <div className="bg-white rounded-[24px] border border-pink-50 shadow-soft p-10 text-center mt-8">
          <p className="text-4xl">🍯</p>
          <h2 className="font-script text-2xl text-morado-oscuro mt-3">No encontramos mermeladas con esos filtros</h2>
          <p className="text-gray-500 mt-2">Prueba con otra fruta o quita los filtros.</p>
          {hayFiltros && (
            <button
              onClick={() => { setSearch(''); setCategoria(''); setSort(''); setNovedades(false); setPrecioMax(''); }}
              className="mt-5 bg-gradient-to-r from-rosa-pastel to-lila text-white px-6 py-2.5 rounded-full font-semibold"
            >
              Quitar filtros
            </button>
          )}
          <p className="text-sm text-gray-400 mt-4">
            ¿Buscabas algo especial? <Link to="/novedades" className="text-rosa-pastel font-medium">Mira las novedades →</Link>
          </p>
        </div>
      )}
    </div>
  );
}
