# ─────────────────────────────────────────────────────
# Guía: Conectar Dulce Encanto a Supabase
# ─────────────────────────────────────────────────────

## Estado actual verificado

- ✅ **Proyecto Supabase activo**: `jzetdfegilsdphbfusmm` 
- ✅ **Anon key funciona**: `sb_publishable_C3L7H7yEH3NXnnFlPJekuQ_R9Ngdzli`
- ❌ **Tablas de la app NO creadas**: `users`, `products`, `orders`, etc.
- ❌ **PostgreSQL directo**: No accesible desde este entorno (IPv6 unreachable)
- ❌ **Pooler**: Devuelve "tenant/user not found" (posible problema con el password)

## Solución 1: Aplicar schema manualmente (RECOMENDADO)

### Paso 1: Crear las tablas

1. Ve a: https://supabase.com/dashboard/project/jzetdfegilsdphbfusmm
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **New Query** (Nuevo query)
4. Pega el contenido del archivo:
   ```
   supabase/migrations/20260904_create_schema.sql
   ```
5. Haz clic en **RUN** (▶)

### Paso 2: Insertar datos de prueba (seed)

Después de crear las tablas, puedes insertar datos usando Prisma:

```bash
# Instalar dependencias
cd backend
npm install

# Generar cliente Prisma para PostgreSQL
npm run prisma:generate:supabase

# Push el schema (alternativa: usa npx prisma db push --schema=prisma/schema.supabase.prisma)
# Configura DATABASE_URL con tu password URL-encoded:
# postgresql://postgres.jzetdfegilsdphbfusmm:[PASSWORD-URL-ENCODED]@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require

# Ejecutar seed
DATABASE_URL="postgresql://postgres.jzetdfegilsdphbfusmm:[PASSWORD-URL-ENCODED]@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require" \
npx prisma db seed --schema=prisma/schema.supabase.prisma
```

## Solución 2: Usar Supabase CLI (si tienes el service_role key)

```bash
# 1. Obtén tu service_role key:
#    Dashboard → Project Settings → API → service_role → "Reveal"
export SUPABASE_ACCESS_TOKEN="<tu-service-role-key>"

# 2. Enlaza el proyecto
npx supabase link --project-ref jzetdfegilsdphbfusmm

# 3. Push el schema
npx supabase db push
```

## Password URL-encoding

Tu password contiene caracteres especiales. Debes URL-encodearlo:

| Carácter | Original | URL-encoded |
|---|---|---|
| `$` | `$` | `%24` |
| `·` | `·` | `%C2%B7` |
| `,` | `,` | `%2C` |
| `.` | `.` | `. ` (no necesita encoding) |
| `-` | `-` | `-` (no necesita encoding) |
| `´` | `´` | `%C2%B4` |
| `+` | `+` | `%2B` |
| ``` ` ``` | `` ` `` | `%60` |
| `¡` | `¡` | `%C2%A1` |

**Password URL-encoded completo:**
```
%24NDR%C2%B7%24S%2C.-%C2%B4%2B%60%C2%A1
```

**DATABASE_URL completa:**
```
postgresql://postgres.jzetdfegilsdphbfusmm:%24NDR%C2%B7%24S%2C.-%C2%B4%2B%60%C2%A1@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require
```

## Configuración en Render

Una vez que hayas aplicado el schema en Supabase:

1. Ve a https://dashboard.render.com → tu servicio `dulce-encanto`
2. **Environment** → **Environment Variables**
3. Cambia:
   - Comenta/remueve: `DATABASE_URL = file:/data/dulce.dev.db`
   - Agrega: `DATABASE_URL = postgresql://postgres.jzetdfegilsdphbfusmm:%24NDR%C2%B7%24S%2C.-%C2%B4%2B%60%C2%A1@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require`
4. **Manual Deploy** → selecciona el commit más reciente → **Deploy**

## Verificar conexión

```bash
# Usando psql (si está instalado)
psql "postgresql://postgres.jzetdfegilsdphbfusmm:[PASSWORD-ENCODED]@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Usando Node.js
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://jzetdfegilsdphbfusmm.supabase.co',
  'sb_publishable_C3L7H7yEH3NXnnFlPJekuQ_R9Ngdzli'
);
supabase.from('products').select('*').limit(1).then(r => console.log(r));
"
```
