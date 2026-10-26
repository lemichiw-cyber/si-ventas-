/**
 * Catálogo estático de Dulce Encanto.
 *
 * El sitio es 100% estático (GitHub Pages), así que el catálogo vive aquí.
 * Para cambiar precios, fotos o añadir un producto basta con editar este archivo:
 * no hace falta servidor, base de datos ni desplegar nada más.
 */

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  imagenUrl: string;
  descripcion: string;
  colorAcento: string;
}

export interface Resena {
  id: string;
  rating: number;
  comentario: string;
  autor: string;
  fecha: string;
}

export interface Nutrition {
  porcion: string;
  calorias: number;
  proteinas: number;
  grasas: number;
  carbohidratos: number;
  azucares: number;
  sodio: number;
  fibra: number;
  porcentajeFruta: number;
}

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  stock: number;
  pesoNeto: string;
  ingredientes: string[];
  beneficios: string[];
  esNovedad: boolean;
  esRecomendado: boolean;
  imagenPrincipal: string;
  imagenesGaleria: string[];
  categoria: Categoria;
  nutrition: Nutrition;
  reviews: Resena[];
}

export const CATEGORIAS: Categoria[] = [
  {
    id: 'cat-fresa',
    nombre: 'Fresa',
    slug: 'fresa',
    imagenUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400',
    descripcion: 'Mermeladas de fresa fresca',
    colorAcento: '#FF6B8A',
  },
  {
    id: 'cat-mora',
    nombre: 'Mora',
    slug: 'mora',
    imagenUrl: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400',
    descripcion: 'Mermelada de mora silvestre',
    colorAcento: '#9370DB',
  },
  {
    id: 'cat-durazno',
    nombre: 'Durazno',
    slug: 'durazno',
    imagenUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    descripcion: 'Dulce durazno de temporada',
    colorAcento: '#FFDAB9',
  },
  {
    id: 'cat-zarzamora',
    nombre: 'Zarzamora',
    slug: 'zarzamora',
    imagenUrl: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=400',
    descripcion: 'Zarzamora intensa y artesanal',
    colorAcento: '#800080',
  },
  {
    id: 'cat-mixtas',
    nombre: 'Mixtas',
    slug: 'mixtas',
    imagenUrl: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400',
    descripcion: 'Combinaciones frutales únicas',
    colorAcento: '#FFB6C1',
  },
];

const cat = (slug: string): Categoria =>
  CATEGORIAS.find(c => c.slug === slug) ?? CATEGORIAS[0];

export const PRODUCTOS: Producto[] = [
  {
    id: 'prod-fresa',
    nombre: 'Mermelada de Fresa Artesanal',
    slug: 'mermelada-fresa-artesanal',
    descripcion:
      'Una explosión de sabor natural en cada cucharada. Hecha con fresas frescas seleccionadas, azúcar y un toque de limón. Textura suave y brillante, ideal para desayunos kawaii.',
    precio: 2.5,
    stock: 120,
    pesoNeto: '250g',
    ingredientes: ['Fresa fresca', 'Azúcar', 'Limón'],
    beneficios: ['Sin conservadores', '100% fruta natural', 'Hecha con amor'],
    esNovedad: false,
    esRecomendado: true,
    imagenPrincipal: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600',
    imagenesGaleria: ['https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600'],
    categoria: cat('fresa'),
    nutrition: {
      porcion: '20g', calorias: 45, proteinas: 0.1, grasas: 0,
      carbohidratos: 11, azucares: 10, sodio: 1, fibra: 0.3, porcentajeFruta: 65,
    },
    reviews: [
      { id: 'r1', rating: 5, comentario: 'La de fresa es mi favorita, sabe a las de la abuela 💖', autor: 'Sakura M.', fecha: '2026-09-12' },
      { id: 'r2', rating: 5, comentario: 'Llegó rapidísimo y el frasco venía súper bien sellado.', autor: 'Karla R.', fecha: '2026-09-28' },
    ],
  },
  {
    id: 'prod-mora',
    nombre: 'Mermelada de Mora',
    slug: 'mermelada-mora',
    descripcion:
      'Mora silvestre recolectada a mano, cocción lenta para preservar antioxidantes. Color violeta intenso y sabor profundo.',
    precio: 2.5,
    stock: 80,
    pesoNeto: '250g',
    ingredientes: ['Mora fresca', 'Azúcar', 'Limón'],
    beneficios: ['Rica en antioxidantes', 'Sin conservadores'],
    esNovedad: false,
    esRecomendado: true,
    imagenPrincipal: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=600',
    imagenesGaleria: ['https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=600'],
    categoria: cat('mora'),
    nutrition: {
      porcion: '20g', calorias: 48, proteinas: 0.2, grasas: 0.1,
      carbohidratos: 11.5, azucares: 9.5, sodio: 1, fibra: 0.5, porcentajeFruta: 68,
    },
    reviews: [
      { id: 'r3', rating: 5, comentario: 'Intensísima, se nota el 68% de fruta. Repetiré 🫐', autor: 'Diana L.', fecha: '2026-10-02' },
    ],
  },
  {
    id: 'prod-durazno',
    nombre: 'Mermelada de Durazno',
    slug: 'mermelada-durazno',
    descripcion:
      'Duraznos jugosos de temporada, dulzor equilibrado y aroma aterciopelado. Perfecta para crepas y yogur.',
    precio: 2.5,
    stock: 95,
    pesoNeto: '250g',
    ingredientes: ['Durazno fresco', 'Azúcar', 'Limón'],
    beneficios: ['Fuente de vitamina A', '100% fruta natural'],
    esNovedad: false,
    esRecomendado: false,
    imagenPrincipal: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600',
    imagenesGaleria: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600'],
    categoria: cat('durazno'),
    nutrition: {
      porcion: '20g', calorias: 46, proteinas: 0.1, grasas: 0,
      carbohidratos: 11.2, azucares: 10.2, sodio: 1, fibra: 0.2, porcentajeFruta: 60,
    },
    reviews: [
      { id: 'r4', rating: 4, comentario: 'Muy dulce y cremosa. Le pondría un poco más de limón.', autor: 'Andrea P.', fecha: '2026-08-30' },
    ],
  },
  {
    id: 'prod-zarzamora',
    nombre: 'Mermelada de Zarzamora',
    slug: 'mermelada-zarzamora',
    descripcion:
      'Zarzamora oscura, sabor intenso y agridulce. Edición premium con 70% fruta.',
    precio: 2.8,
    stock: 60,
    pesoNeto: '250g',
    ingredientes: ['Zarzamora', 'Azúcar', 'Limón'],
    beneficios: ['Premium', '70% fruta', 'Artesanal'],
    esNovedad: false,
    esRecomendado: true,
    imagenPrincipal: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=600',
    imagenesGaleria: ['https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=600'],
    categoria: cat('zarzamora'),
    nutrition: {
      porcion: '20g', calorias: 50, proteinas: 0.2, grasas: 0,
      carbohidratos: 12, azucares: 10.5, sodio: 1, fibra: 0.6, porcentajeFruta: 70,
    },
    reviews: [
      { id: 'r5', rating: 5, comentario: 'La premium vale cada centavo, sabor de verdad 🖤', autor: 'Mateo G.', fecha: '2026-09-19' },
    ],
  },
  {
    id: 'prod-mixta',
    nombre: 'Mermelada Mixta (Fresa-Mora)',
    slug: 'mermelada-mixta-fresa-mora',
    descripcion:
      '¡Novedad! La combinación más cute: fresa dulce + mora intensa. Edición limitada con corazón dorado.',
    precio: 3.0,
    stock: 45,
    pesoNeto: '250g',
    ingredientes: ['Fresa', 'Mora', 'Azúcar', 'Limón'],
    beneficios: ['Edición limitada', 'Mix frutal', 'Sin conservadores'],
    esNovedad: true,
    esRecomendado: true,
    imagenPrincipal: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600',
    imagenesGaleria: ['https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600'],
    categoria: cat('mixtas'),
    nutrition: {
      porcion: '20g', calorias: 47, proteinas: 0.15, grasas: 0,
      carbohidratos: 11.3, azucares: 10, sodio: 1, fibra: 0.4, porcentajeFruta: 66,
    },
    reviews: [
      { id: 'r6', rating: 5, comentario: 'Edición limitada que dura poquito en mi despensa 😭', autor: 'Valeria S.', fecha: '2026-10-10' },
    ],
  },
];
