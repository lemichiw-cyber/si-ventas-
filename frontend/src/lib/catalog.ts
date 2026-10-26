/**
 * Acceso al catálogo estático con la misma forma que antes tenía la API.
 *
 * El sitio vive solo en GitHub Pages, así que no hay servidor: los datos
 * vienen de `data/catalogo.ts` y las reseñas que dejan los visitantes se
 * guardan en el navegador (localStorage).
 */
import { CATEGORIAS, PRODUCTOS, type Producto, type Resena } from '../data/catalogo';

const CLAVE_RESENAS = 'dulce-resenas';

/** Pausa mínima para que se vean los estados de carga reales. */
const espera = (ms = 260) => new Promise<void>(resolve => setTimeout(resolve, ms));

export interface Filtros {
  limit?: number;
  recomendados?: boolean;
  novedades?: boolean;
  search?: string;
  categoria?: string;
  sort?: string;
  precioMax?: number;
}

function resenasLocales(): Record<string, Resena[]> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RESENAS) || '{}');
  } catch {
    return {};
  }
}

function productoConExtras(p: Producto): Producto & { related: Producto[] } {
  const locales = resenasLocales()[p.id] || [];
  return {
    ...p,
    reviews: [...locales, ...p.reviews],
    related: PRODUCTOS.filter(r => r.id !== p.id && (r.categoria.slug === p.categoria.slug || r.esRecomendado)).slice(0, 4),
  };
}

export async function listarProductos(f: Filtros = {}): Promise<Producto[]> {
  await espera();
  let lista = [...PRODUCTOS];

  if (f.recomendados) lista = lista.filter(p => p.esRecomendado);
  if (f.novedades) lista = lista.filter(p => p.esNovedad);
  if (f.categoria) lista = lista.filter(p => p.categoria.slug === f.categoria);
  if (f.precioMax != null && f.precioMax > 0) lista = lista.filter(p => p.precio <= f.precioMax!);

  if (f.search) {
    const q = f.search.trim().toLowerCase();
    lista = lista.filter(
      p =>
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q) ||
        p.categoria.nombre.toLowerCase().includes(q) ||
        p.ingredientes.some(i => i.toLowerCase().includes(q))
    );
  }

  if (f.sort === 'precio-asc') lista.sort((a, b) => a.precio - b.precio);
  else if (f.sort === 'precio-desc') lista.sort((a, b) => b.precio - a.precio);
  else if (f.sort === 'nombre') lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  else lista.sort((a, b) => Number(b.esNovedad) - Number(a.esNovedad) || Number(b.esRecomendado) - Number(a.esRecomendado));

  if (f.limit && f.limit > 0) lista = lista.slice(0, f.limit);
  return lista;
}

export async function obtenerProducto(slug: string): Promise<(Producto & { related: Producto[] }) | null> {
  await espera();
  const p = PRODUCTOS.find(x => x.slug === slug);
  return p ? productoConExtras(p) : null;
}

export function obtenerProductoLocal(slug: string): (Producto & { related: Producto[] }) | null {
  const p = PRODUCTOS.find(x => x.slug === slug);
  return p ? productoConExtras(p) : null;
}

export async function listarCategorias() {
  return CATEGORIAS;
}

/** Guarda una reseña en el navegador y la devuelve. */
export function guardarResena(productoId: string, rating: number, comentario: string, autor: string): Resena {
  const nueva: Resena = {
    id: `local-${Date.now()}`,
    rating: Math.min(5, Math.max(1, Math.round(rating))),
    comentario: comentario.trim(),
    autor: autor.trim() || 'Fan anónimo 💜',
    fecha: new Date().toISOString().slice(0, 10),
  };
  const todas = resenasLocales();
  todas[productoId] = [nueva, ...(todas[productoId] || [])].slice(0, 20);
  try {
    localStorage.setItem(CLAVE_RESENAS, JSON.stringify(todas));
  } catch {
    /* modo privado: la reseña solo se ve en esta sesión */
  }
  return nueva;
}

export { CATEGORIAS, PRODUCTOS };
export type { Producto, Resena };
