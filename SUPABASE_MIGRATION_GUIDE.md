# ─────────────────────────────────────────────────────
# Supabase Migration — Instrucciones para aplicar el schema
# ─────────────────────────────────────────────────────

## Opción 1: Usar el SQL Editor de Supabase (más fácil)

1. Ve a https://supabase.com/dashboard → tu proyecto → **SQL Editor**
2. Pega el contenido de `supabase/migrations/20260904_create_schema.sql`
3. Haz clic en **RUN** para crear todas las tablas

## Opción 2: Usar Prisma (requiere conexión al DB)

1. En tu máquina local, crea un `.env` con la DATABASE_URL de Supabase:
   ```
   DATABASE_URL="postgresql://postgres:[TU_PASSWORD]@db.jzetdfegilsdphbfusmm.supabase.co:5432/postgres"
   ```
2. Ejecuta:
   ```bash
   npx prisma generate --schema=prisma/schema.supabase.prisma
   npx prisma db push --schema=prisma/schema.supabase.prisma --accept-data-loss
   ```

## Opción 3: Usar el script de migración

```bash
# En tu máquina local (con psql instalado)
psql "postgresql://postgres:[PASSWORD]@db.jzetdfegilsdphbfusmm.supabase.co:5432/postgres" \
  -f supabase/migrations/20260904_create_schema.sql
```

## Opción 4: Vía Supabase CLI

```bash
# Instala la CLI
npm install -g supabase

# Login
supabase login

# Enlaza tu proyecto
supabase link --project-ref jzetdfegilsdphbfusmm

# Aplica la migración
supabase db push
```

## 🚨 Importante: El password de la base de datos

El password `$NDR·$S,.-´+`¡` contiene caracteres especiales. Si usas Prisma o psql, asegúrate de **URL-encode** el password:

```
postgresql://postgres:%24NDR%C2%B7%24S%2C.-%C2%B4%2B%60%C2%A1@db.jzetdfegilsdphbfusmm.supabase.co:5432/postgres
```

O usa las comillas adecuadas en tu `.env`.

## Verificar conexión

```bash
# Ver conexión con Node.js + pg
node -e "
const pg = require('pg');
const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
c.connect().then(async () => {
  const r = await c.query('SELECT version()');
  console.log(r.rows[0]);
  c.end();
}).catch(e => console.error(e.message));
"
```
