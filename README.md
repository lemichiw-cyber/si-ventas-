# 🍓 Dulce Encanto - Mermeladas Artesanales

E-commerce kawaii artesanal con paleta rosa/lila, estética femenina, animaciones dulces.

> Eslogan: "Una explosión de sabor natural en cada cucharada. ¡Hechas con amor y fruta fresca!"

## Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + React Router + Zustand + TanStack Query + Axios
- **Backend:** Node + Express + TypeScript + Prisma + JWT + Zod + Bcrypt + Helmet/CORS/RateLimit + AES-256
- **DB:** SQLite para dev (file:./dev.db), PostgreSQL para prod (cambiar provider en `prisma/schema.prisma`)

## Estructura
```
dulce-encanto/
  backend/  -> Express API
  frontend/ -> React SPA
```

## Instalación Paso a Paso

### 1. Clonar & instalar
```bash
npm install
npm install --workspace=backend
npm install --workspace=frontend
```

### 2. Variables de entorno
```bash
cp .env.example backend/.env
cp .env.example frontend/.env  # o crea frontend/.env con VITE_API_URL
```
Edita `backend/.env`:
```
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
AES_KEY="0123456789abcdef0123456789abcdef"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

Para producción PostgreSQL:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/dulce_encanto?schema=public"
# y en prisma/schema.prisma cambiar provider a postgresql
```

### 3. Base de datos
```bash
# Desde la raíz (workspaces) - FORMA CORRECTA:
npm run prisma:generate          # equivale a: npm --workspace backend run prisma:generate
npm run prisma:push              # equivale a: npm --workspace backend run prisma:push
# O si usas migrate:
# npm --workspace backend run prisma:migrate

npm run seed                     # crea 5 productos, 5 categorías, 2 usuarios

# Alternativa entrando a backend:
cd backend
npx prisma generate
npx prisma db push
npm run seed
cd ..
```

> ⚠️ No uses `npx prisma generate --workspace=backend` (esa flag no existe en Prisma). Usa los scripts de npm de arriba.

Usuarios seed:
- `admin@dulceencanto.com` / `Admin123!` (rol admin)
- `cliente@test.com` / `Cliente123!` (rol cliente)

### 4. Desarrollo
```bash
# Instalar concurrently si no está (ya incluido en root package.json):
npm install

# Terminal 1
npm run dev:backend  # http://localhost:4000  -> API
# Terminal 2
npm run dev:frontend # http://localhost:5173  -> Web kawaii
# O ambos a la vez (requiere concurrently):
npm run dev
```

Health: `GET http://localhost:4000/api/health` (no `GET /`, el backend solo sirve `/api/*`; el frontend está en :5173)

### 5. Build
```bash
npm run build
```

## API Endpoints

| Método | Ruta | Auth |
|--------|------|------|
| POST | /api/auth/register | - |
| POST | /api/auth/login | - |
| POST | /api/auth/refresh | - |
| POST | /api/auth/logout | - |
| POST | /api/auth/forgot-password | - |
| GET | /api/auth/me | Bearer |
| PUT | /api/auth/me | Bearer |
| GET | /api/products?categoria&precio_min&precio_max&novedades&recomendados&search&sort&page&limit | - |
| GET | /api/products/:slug | - |
| GET | /api/products/:id/nutrition | - |
| GET | /api/products/:id/reviews | - |
| POST | /api/products | admin |
| PUT | /api/products/:id | admin |
| DELETE | /api/products/:id | admin |
| GET | /api/cart | - (X-Session-Id) |
| POST | /api/cart/items | - |
| PUT | /api/cart/items/:productId | - |
| DELETE | /api/cart/items/:productId | - |
| POST | /api/orders | Bearer |
| GET | /api/orders | Bearer (admin ve todas) |
| GET | /api/orders/:id | Bearer |
| PUT | /api/orders/:id/status | admin |
| POST | /api/reviews | Bearer (compra verificada) |

### Colección Postman
Importa `postman_collection.json` (incluido). Variables: `{{baseUrl}} = http://localhost:4000/api`, `{{token}}`.

Ejemplo login:
```bash
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"cliente@test.com","password":"Cliente123!"}'
```

## Seguridad
- Bcrypt 12 rounds
- AES-256-CBC para telefono/direccion y direccion_envio
- JWT 15m access + 7d refresh en httpOnly cookies + Bearer
- Helmet, CORS, Rate Limit 100/15min y 5 login/min, Zod validation, sanitización

## Diseño
- Colores: #D8B4E2, #FFB7C5, #FFF0F5, #F8F4FF, #FFD700, #4A0E4E
- Bordes 16-24px, sombras suaves, gradientes rosa→lila, badges ¡Nuevo!, iconos fruta opacidad 10%
- Fuentes: Pacifico (títulos), Poppins/Nunito (cuerpo)
- Animaciones: framer-motion fade+slide, hover scale 1.03, bounce en badge carrito

## Docker (opcional)
```bash
docker-compose up --build
```

## Responsive & Accesibilidad
- Tailwind responsive grid, imágenes lazy, aria-labels, contraste validado, navegación teclado.

## Performance
- Vite code splitting, lazy loading imágenes, React Query cache.
