"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = require("../src/utils/crypto");
const prisma = new client_1.PrismaClient();
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
        prisma.category.create({ data: { nombre: 'Fresa', slug: 'fresa', imagenUrl: 'https://images.unsplash.com/photo-1543528171-ed40a2604160?w=400', descripcion: 'Mermeladas de fresa fresca', colorAcento: '#FF6B8A' } }),
        prisma.category.create({ data: { nombre: 'Mora', slug: 'mora', imagenUrl: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400', descripcion: 'Mermelada de mora silvestre', colorAcento: '#9370DB' } }),
        prisma.category.create({ data: { nombre: 'Durazno', slug: 'durazno', imagenUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400', descripcion: 'Dulce durazno de temporada', colorAcento: '#FFDAB9' } }),
        prisma.category.create({ data: { nombre: 'Zarzamora', slug: 'zarzamora', imagenUrl: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=400', descripcion: 'Zarzamora intensa y artesanal', colorAcento: '#800080' } }),
        prisma.category.create({ data: { nombre: 'Mixtas', slug: 'mixtas', imagenUrl: 'https://images.unsplash.com/photo-1474440690486-0a34d1d3656c?w=400', descripcion: 'Combinaciones frutales únicas', colorAcento: '#FFB6C1' } }),
    ]);
    const catMap = {};
    categories.forEach(c => catMap[c.slug] = c.id);
    const productsData = [
        {
            nombre: 'Mermelada de Fresa Artesanal',
            slug: 'mermelada-fresa-artesanal',
            descripcion: 'Una explosión de sabor natural en cada cucharada. Hecha con fresas frescas seleccionadas, azúcar y un toque de limón. Textura suave y brillante, ideal para desayunos kawaii.',
            precio: 2.5, costoProduccion: 1.7, stock: 120, categoriaId: catMap['fresa'],
            pesoNeto: '250g', ingredientes: ['Fresa fresca', 'Azúcar', 'Limón'], beneficios: ['Sin conservadores', '100% fruta natural', 'Hecha con amor'],
            esNovedad: false, esRecomendado: true,
            imagenPrincipal: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600',
            imagenesGaleria: ['https://images.unsplash.com/photo-1543528171-ed40a2604160?w=600'],
            nutrition: { porcion: '20g', calorias: 45, proteinas: 0.1, grasas: 0, carbohidratos: 11, azucares: 10, sodio: 1, fibra: 0.3, porcentajeFruta: 65 },
        },
        {
            nombre: 'Mermelada de Mora',
            slug: 'mermelada-mora',
            descripcion: 'Mora silvestre recolectada a mano, cocción lenta para preservar antioxidantes. Color violeta intenso y sabor profundo.',
            precio: 2.5, costoProduccion: 1.7, stock: 80, categoriaId: catMap['mora'],
            pesoNeto: '250g', ingredientes: ['Mora fresca', 'Azúcar', 'Limón'], beneficios: ['Rica en antioxidantes', 'Sin conservadores'],
            esNovedad: false, esRecomendado: true,
            imagenPrincipal: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=600',
            nutrition: { porcion: '20g', calorias: 48, proteinas: 0.2, grasas: 0.1, carbohidratos: 11.5, azucares: 9.5, sodio: 1, fibra: 0.5, porcentajeFruta: 68 },
        },
        {
            nombre: 'Mermelada de Durazno',
            slug: 'mermelada-durazno',
            descripcion: 'Duraznos jugosos de temporada, dulzor equilibrado y aroma aterciopelado. Perfecta para crepas y yogur.',
            precio: 2.5, costoProduccion: 1.7, stock: 95, categoriaId: catMap['durazno'],
            pesoNeto: '250g', ingredientes: ['Durazno fresco', 'Azúcar', 'Limón'], beneficios: ['Fuente de vitamina A', '100% fruta natural'],
            esNovedad: false, esRecomendado: false,
            imagenPrincipal: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600',
            nutrition: { porcion: '20g', calorias: 46, proteinas: 0.1, grasas: 0, carbohidratos: 11.2, azucares: 10.2, sodio: 1, fibra: 0.2, porcentajeFruta: 60 },
        },
        {
            nombre: 'Mermelada de Zarzamora',
            slug: 'mermelada-zarzamora',
            descripcion: 'Zarzamora oscura, sabor intenso y agridulce. Edición premium con 70% fruta.',
            precio: 2.8, costoProduccion: 1.9, stock: 60, categoriaId: catMap['zarzamora'],
            pesoNeto: '250g', ingredientes: ['Zarzamora', 'Azúcar', 'Limón'], beneficios: ['Premium', '70% fruta', 'Artesanal'],
            esNovedad: false, esRecomendado: true,
            imagenPrincipal: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=600',
            nutrition: { porcion: '20g', calorias: 50, proteinas: 0.2, grasas: 0, carbohidratos: 12, azucares: 10.5, sodio: 1, fibra: 0.6, porcentajeFruta: 70 },
        },
        {
            nombre: 'Mermelada Mixta (Fresa-Mora)',
            slug: 'mermelada-mixta-fresa-mora',
            descripcion: '¡Novedad! La combinación más cute: fresa dulce + mora intensa. Edición limitada con corazón dorado.',
            precio: 3.0, costoProduccion: 2.1, stock: 45, categoriaId: catMap['mixtas'],
            pesoNeto: '250g', ingredientes: ['Fresa', 'Mora', 'Azúcar', 'Limón'], beneficios: ['Edición limitada', 'Mix frutal', 'Sin conservadores'],
            esNovedad: true, esRecomendado: true,
            imagenPrincipal: 'https://images.unsplash.com/photo-1474440690486-0a34d1d3656c?w=600',
            nutrition: { porcion: '20g', calorias: 47, proteinas: 0.15, grasas: 0, carbohidratos: 11.3, azucares: 10, sodio: 1, fibra: 0.4, porcentajeFruta: 66 },
        },
    ];
    for (const p of productsData) {
        const { nutrition, ...prod } = p;
        const data = {
            ...prod,
            imagenesGaleria: JSON.stringify(prod.imagenesGaleria),
            ingredientes: JSON.stringify(prod.ingredientes),
            beneficios: JSON.stringify(prod.beneficios),
        };
        const created = await prisma.product.create({ data });
        await prisma.nutritionFacts.create({ data: { productoId: created.id, ...nutrition } });
    }
    const adminPass = await (0, crypto_1.hashPassword)('Admin123!');
    const userPass = await (0, crypto_1.hashPassword)('Cliente123!');
    await prisma.user.create({
        data: { email: 'admin@dulceencanto.com', passwordHash: adminPass, nombre: 'Admin', apellido: 'Encanto', rol: 'admin' },
    });
    await prisma.user.create({
        data: { email: 'cliente@test.com', passwordHash: userPass, nombre: 'Sakura', apellido: 'Mora', rol: 'cliente' },
    });
    console.log('✅ Seed completado: 5 categorías, 5 productos, 2 usuarios');
    console.log('   admin@dulceencanto.com / Admin123!');
    console.log('   cliente@test.com / Cliente123!');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
