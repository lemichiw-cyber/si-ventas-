import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Dulce Encanto...');

  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.nutritionFacts.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cartSession.deleteMany();

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        nombre: 'Fresa',
        slug: 'fresa',
        imagenUrl: 'https://images.unsplash.com/photo-1543528171-ed40a2604160?w=400',
        descripcion: 'Mermeladas de fresa fresca',
        colorAcento: '#FF6B8A',
      },
    }),
    prisma.category.create({
      data: {
        nombre: 'Mora',
        slug: 'mora',
        imagenUrl: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400',
        descripcion: 'Mermelada de mora silvestre',
        colorAcento: '#9370DB',
      },
    }),
    prisma.category.create({
      data: {
        nombre: 'Durazno',
        slug: 'durazno',
        imagenUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
        descripcion: 'Dulce durazno de temporada',
        colorAcento: '#FFDAB9',
      },
    }),
    prisma.category.create({
      data: {
        nombre: 'Zarzamora',
        slug: 'zarzamora',
        imagenUrl: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=400',
        descripcion: 'Zarzamora intensa y artesanal',
        colorAcento: '#800080',
      },
    }),
    prisma.category.create({
      data: {
        nombre: 'Mixtas',
        slug: 'mixtas',
        imagenUrl: 'https://images.unsplash.com/photo-1474440690486-0a34d1d3656c?w=400',
        descripcion: 'Combinaciones frutales únicas',
        colorAcento: '#FFB6C1',
      },
    }),
    // New categories
    prisma.category.create({
      data: {
        nombre: 'Mango',
        slug: 'mango',
        imagenUrl: 'https://images.unsplash.com/photo-1553028201-fe492f20a457?w=400',
        descripcion: 'Mermelada de mango tropical',
        colorAcento: '#FFB347',
      },
    }),
    prisma.category.create({
      data: {
        nombre: 'Maracuyá',
        slug: 'maracuya',
        imagenUrl: 'https://images.unsplash.com/photo-1544441524-53531b99c1f4?w=400',
        descripcion: 'Mermelada de maracuyá ácida y vibrante',
        colorAcento: '#FFD580',
      },
    }),
  ]);

  const catMap: Record<string, string> = {};
  categories.forEach((c) => (catMap[c.slug] = c.id));

  const productsData = [
    // Existing products
    {
      nombre: 'Mermelada de Fresa Artesanal',
      slug: 'mermelada-fresa-artesanal',
      descripcion: 'Una explosión de sabor natural en cada cucharada. Hecha con fresas frescas seleccionadas, azúcar y un toque de limón. Textura suave y brillante, ideal para desayunos kawaii.',
      precio: 2.5,
      costoProduccion: 1.7,
      stock: 120,
      categoriaId: catMap['fresa'],
      pesoNeto: '250g',
      ingredientes: ['Fresa fresca', 'Azúcar', 'Limón'],
      beneficios: ['Sin conservadores', '100% fruta natural', 'Hecha con amor'],
      esNovedad: false,
      esRecomendado: true,
      imagenPrincipal: 'https://images.unsplash.com/photo-1700166581152-5489eb689333?w=600&q=80',
      imagenesGaleria: ['https://images.unsplash.com/photo-1543528171-ed40a2604160?w=600'],
      nutrition: { porcion: '20g', calorias: 45, proteinas: 0.1, grasas: 0, carbohidratos: 11, azucares: 10, sodio: 1, fibra: 0.3, porcentajeFruta: 65 },
    },
    {
      nombre: 'Mermelada de Mora',
      slug: 'mermelada-mora',
      descripcion: 'Mora silvestre recolectada a mano, cocción lenta para preservar antioxidantes. Color violeta intenso y sabor profundo.',
      precio: 2.5,
      costoProduccion: 1.7,
      stock: 80,
      categoriaId: catMap['mora'],
      pesoNeto: '250g',
      ingredientes: ['Mora fresca', 'Azúcar', 'Limón'],
      beneficios: ['Rica en antioxidantes', 'Sin conservadores'],
      esNovedad: false,
      esRecomendado: true,
      imagenPrincipal: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=600',
      nutrition: { porcion: '20g', calorias: 48, proteinas: 0.2, grasas: 0.1, carbohidratos: 11.5, azucares: 9.5, sodio: 1, fibra: 0.5, porcentajeFruta: 68 },
    },
    {
      nombre: 'Mermelada de Durazno',
      slug: 'mermelada-durazno',
      descripcion: 'Duraznos jugosos de temporada, dulzor equilibrado y aroma aterciopelado. Perfecta para crepas y yogur.',
      precio: 2.5,
      costoProduccion: 1.7,
      stock: 95,
      categoriaId: catMap['durazno'],
      pesoNeto: '250g',
      ingredientes: ['Durazno fresco', 'Azúcar', 'Limón'],
      beneficios: ['Fuente de vitamina A', '100% fruta natural'],
      esNovedad: false,
      esRecomendado: false,
      imagenPrincipal: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600',
      nutrition: { porcion: '20g', calorias: 46, proteinas: 0.1, grasas: 0, carbohidratos: 11.2, azucares: 10.2, sodio: 1, fibra: 0.2, porcentajeFruta: 60 },
    },
    {
      nombre: 'Mermelada de Zarzamora',
      slug: 'mermelada-zarzamora',
      descripcion: 'Zarzamora oscura, sabor intenso y agridulce. Edición premium con 70% fruta.',
      precio: 2.8,
      costoProduccion: 1.9,
      stock: 60,
      categoriaId: catMap['zarzamora'],
      pesoNeto: '250g',
      ingredientes: ['Zarzamora', 'Azúcar', 'Limón'],
      beneficios: ['Premium', '70% fruta', 'Artesanal'],
      esNovedad: false,
      esRecomendado: true,
      imagenPrincipal: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=600',
      nutrition: { porcion: '20g', calorias: 50, proteinas: 0.2, grasas: 0, carbohidratos: 12, azucares: 10.5, sodio: 1, fibra: 0.6, porcentajeFruta: 70 },
    },
    {
      nombre: 'Mermelada Mixta (Fresa-Mora)',
      slug: 'mermelada-mixta-fresa-mora',
      descripcion: '¡Novedad! La combinación más cute: fresa dulce + mora intensa. Edición limitada con corazón dorado.',
      precio: 3.0,
      costoProduccion: 2.1,
      stock: 45,
      categoriaId: catMap['mixtas'],
      pesoNeto: '250g',
      ingredientes: ['Fresa', 'Mora', 'Azúcar', 'Limón'],
      beneficios: ['Edición limitada', 'Mix frutal', 'Sin conservadores'],
      esNovedad: true,
      esRecomendado: true,
      imagenPrincipal: 'https://images.unsplash.com/photo-1474440690486-0a34d1d3656c?w=600',
      nutrition: { porcion: '20g', calorias: 47, proteinas: 0.15, grasas: 0, carbohidratos: 11.3, azucares: 10, sodio: 1, fibra: 0.4, porcentajeFruta: 66 },
    },
    // New products (5 additional)
    {
      nombre: 'Mermelada de Mango Tropical',
      slug: 'mermelada-mango-tropical',
      descripcion: 'Mango Ataulfo jugoso y dulce, reducido a fuego lento para obtener una textura sedosa y color anaranjado brillante. Ideal para acompañar yogures y panes.',
      precio: 2.8,
      costoProduccion: 1.9,
      stock: 75,
      categoriaId: catMap['mango'],
      pesoNeto: '250g',
      ingredientes: ['Mango Ataulfo', 'Azúcar', 'Jugo de limón'],
      beneficios: ['Rico en vitamina C', '100% fruta natural', 'Sin conservadores'],
      esNovedad: true,
      esRecomendado: false,
      imagenPrincipal: 'https://images.unsplash.com/photo-1553028201-fe492f20a457?w=600&q=80',
      nutrition: { porcion: '20g', calorias: 44, proteinas: 0.3, grasas: 0.1, carbohidratos: 10.8, azucares: 9.8, sodio: 0, fibra: 0.6, porcentajeFruta: 72 },
    },
    {
      nombre: 'Mermelada de Maracuyá Ácida',
      slug: 'mermelada-maracuya-acida',
      descripcion: 'Maracuyá puro y vibrante con su característico sabor áculo-dulce. Un explote de energía en cada cucharada. Edición de temporada.',
      precio: 3.2,
      costoProduccion: 2.2,
      stock: 38,
      categoriaId: catMap['maracuya'],
      pesoNeto: '250g',
      ingredientes: ['Pulpa de maracuyá', 'Azúcar', 'Cáscara de naranja'],
      beneficios: ['Alto contenido de antioxidantes', 'Edición limitada', 'Sin conservadores'],
      esNovedad: true,
      esRecomendado: true,
      imagenPrincipal: 'https://images.unsplash.com/photo-1544441524-53531b99c1f4?w=600&q=80',
      nutrition: { porcion: '20g', calorias: 42, proteinas: 0.1, grasas: 0, carbohidratos: 10.5, azucares: 8.5, sodio: 1, fibra: 0.8, porcentajeFruta: 75 },
    },
    {
      nombre: 'Mermelada de Fresa con Miel',
      slug: 'mermelada-fresa-miel',
      descripcion: 'Nuestra clásica fresa artesanal potenciada con miel de abeja local. Un equilibrio perfecto entre dulzor natural y sabor frutal. ¡Edición premium!',
      precio: 3.5,
      costoProduccion: 2.3,
      stock: 50,
      categoriaId: catMap['fresa'],
      pesoNeto: '250g',
      ingredientes: ['Fresa fresca', 'Miel de abeja', 'Limón'],
      beneficios: ['Con miel real', 'Sin refinados', 'Premium'],
      esNovedad: false,
      esRecomendado: true,
      imagenPrincipal: 'https://images.unsplash.com/photo-1518329980540-2c7d7c0e3e9e?w=600&q=80',
      imagenesGaleria: ['https://images.unsplash.com/photo-1543528171-ed40a2604160?w=600'],
      nutrition: { porcion: '20g', calorias: 48, proteinas: 0.1, grasas: 0, carbohidratos: 11.8, azucares: 10.2, sodio: 1, fibra: 0.3, porcentajeFruta: 68 },
    },
    {
      nombre: 'Mermelada de Mora con Menta',
      slug: 'mermelada-mora-menta',
      descripcion: 'Mora silvestre combinada con un toque de menta fresca. Un contraste revitalizante que despierta los sentidos. Ideal para postres.',
      precio: 2.9,
      costoProduccion: 1.9,
      stock: 65,
      categoriaId: catMap['mora'],
      pesoNeto: '250g',
      ingredientes: ['Mora fresca', 'Hojas de menta', 'Azúcar'],
      beneficios: ['Con menta natural', 'Sin conservadores', 'Rico en antioxidantes'],
      esNovedad: true,
      esRecomendado: false,
      imagenPrincipal: 'https://images.unsplash.com/photo-1571524779949-1d5b7e6e6b3d?w=600&q=80',
      nutrition: { porcion: '20g', calorias: 46, proteinas: 0.2, grasas: 0, carbohidratos: 11.2, azucares: 9.8, sodio: 0, fibra: 0.5, porcentajeFruta: 67 },
    },
    {
      nombre: 'Kit de Regalo 3 Sabores',
      slug: 'kit-regalo-3-sabores',
      descripcion: 'La experiencia completa Dulce Encanto en un solo paquete. Incluye mini frascos de Fresa, Mora y Zarzamora. Presentación kawaii con cinta dorada. ¡Perfecto para regalar! 🎁',
      precio: 7.5,
      costoProduccion: 5.2,
      stock: 30,
      categoriaId: catMap['mixtas'],
      pesoNeto: '120g x3',
      ingredientes: ['Fresa', 'Mora', 'Zarzamora', 'Azúcar', 'Limón'],
      beneficios: ['Edición especial', 'Regalo perfecto', 'Presentación premium'],
      esNovedad: false,
      esRecomendado: true,
      imagenPrincipal: 'https://images.unsplash.com/photo-1474440690486-0a34d1d3656c?w=600&q=80',
      nutrition: { porcion: '20g x3', calorias: 47, proteinas: 0.15, grasas: 0, carbohidratos: 11.3, azucares: 10, sodio: 1, fibra: 0.4, porcentajeFruta: 66 },
    },
  ];

  for (const p of productsData) {
    const { nutrition, ...prod } = p;
    const data: any = {
      ...prod,
      imagenesGaleria: JSON.stringify(prod.imagenesGaleria || []),
      ingredientes: JSON.stringify(prod.ingredientes),
      beneficios: JSON.stringify(prod.beneficios),
    };
    const created = await prisma.product.create({ data });
    await prisma.nutritionFacts.create({ data: { productoId: created.id, ...nutrition } });
  }

  // Users with encrypted phone/address
  const adminPass = await hashPassword('Admin123!');
  const userPass = await hashPassword('Cliente123!');

  await prisma.user.create({
    data: {
      email: 'admin@dulceencanto.com',
      passwordHash: adminPass,
      nombre: 'Admin',
      apellido: 'Encanto',
      rol: 'admin',
    },
  });
  await prisma.user.create({
    data: {
      email: 'cliente@test.com',
      passwordHash: userPass,
      nombre: 'Sakura',
      apellido: 'Mora',
      rol: 'cliente',
    },
  });

  // Seed a demo order so tracking page has data to show (admin user)
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@dulceencanto.com' } });
  if (adminUser) {
    const product = await prisma.product.findUnique({ where: { slug: 'mermelada-mixta-fresa-mora' } });
    if (product) {
      const { encrypt } = await import('../src/utils/crypto');
      await prisma.order.create({
        data: {
          userId: adminUser.id,
          total: 5.5,
          estado: 'enviado',
          direccionEnvio: encrypt('Av. Dulce Encanto 123, Springfield'),
          metodoPago: 'mock',
          trackingNumber: encrypt('TRACK-DEMO-742951'),
          trackingCarrier: 'FedEx',
          shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          items: {
            create: [
              { productId: product.id, cantidad: 2, precioUnitario: product.precio, subtotal: product.precio * 2 },
            ],
          },
        },
      });
    }
  }

  console.log('✅ Seed completado: 7 categorías, 10 productos, 2 usuarios');
  console.log('   admin@dulceencanto.com / Admin123!');
  console.log('   cliente@test.com / Cliente123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
