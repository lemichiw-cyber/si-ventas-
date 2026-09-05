#!/bin/sh
set -e

echo "🍓 Dulce Encanto — iniciando..."

# Puerto público que Render asigna (si no está definido, usamos 10000)
export PUBLIC_PORT="${PORT:-10000}"

# Disco persistente de Render para SQLite (solo si usamos SQLite)
mkdir -p /data

# DATABASE_URL — si está vacío, usar SQLite en disco
export DATABASE_URL="${DATABASE_URL:-file:/data/dulce.dev.db}"

echo "→ Conexión a base de datos configurada"

# Si DATABASE_URL apunta a PostgreSQL, aplicar schema
case "$DATABASE_URL" in
  postgresql://*|postgres://*)
    echo "→ Usando PostgreSQL (Supabase)"
    echo "→ Aplicando schema con Prisma db push..."
    npx prisma db push --accept-data-loss --skip-generate
    ;;
  *)
    echo "→ Usando SQLite"
    echo "→ Aplicando esquema con Prisma db push..."
    npx prisma db push --skip-generate
    ;;
esac

# Verificar datos iniciales
echo "→ Verificando datos iniciales..."
NEED_SEED=$(node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.user.count().then(c=>console.log(c===0?"yes":"no")).catch(()=>console.log("yes"))' 2>/dev/null)

if [ "$NEED_SEED" = "yes" ]; then
  echo "→ Sembrando datos de demostración (primera ejecución)..."
  node dist-seed/backend/prisma/seed.js || echo "⚠️ Seed falló — puedes ejecutarlo manualmente."
else
  echo "→ Base de datos ya inicializada, se omite el seed."
fi

# Configurar nginx
echo "→ Configurando nginx en el puerto $PUBLIC_PORT..."
envsubst '${PUBLIC_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
nginx

# Iniciar API
echo "→ API escuchando en el puerto interno 4000..."
export PORT=4000
exec node dist/index.js
