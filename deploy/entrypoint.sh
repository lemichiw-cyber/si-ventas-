#!/bin/sh
set -e
echo "🍓 Dulce Encanto — iniciando..."

# Puerto público que Render asigna (si no está definido, usamos 10000)
PUBLIC_PORT="${PORT:-10000}"

# Disco persistente de Render para SQLite
mkdir -p /data
export DATABASE_URL="${DATABASE_URL:-file:/data/dulce.dev.db}"

echo "→ Aplicando esquema de base de datos (prisma db push)..."
npx prisma db push --skip-generate

echo "→ Verificando datos iniciales..."
NEED_SEED=$(node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.user.count().then(c=>console.log(c===0?"yes":"no")).catch(()=>console.log("yes"))')

if [ "$NEED_SEED" = "yes" ]; then
  echo "→ Sembrando datos de demostración (primera ejecución)..."
  npx ts-node prisma/seed.ts || echo "⚠️ Seed falló — puedes ejecutarlo manualmente."
else
  echo "→ Base de datos ya inicializada, se omite el seed."
fi

echo "→ Configurando nginx en el puerto $PUBLIC_PORT..."
envsubst '${PUBLIC_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
nginx

echo "→ API escuchando en el puerto interno 4000..."
export PORT=4000
exec node dist/index.js