-- ─────────────────────────────────────────────────────
-- Supabase migration: Dulce Encanto schema
-- Run this in Supabase SQL Editor or via `supabase db push`
-- ─────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Tabla: categorías
create table if not exists "categories" (
  id          uuid    primary key default uuid_generate_v4(),
  "nombre"    text    not null,
  "slug"      text    unique not null,
  "imagenUrl" text,
  "descripcion" text,
  "colorAcento" text,
  "createdAt"   timestamp(3) default CURRENT_TIMESTAMP,
  "updatedAt"   timestamp(3) default CURRENT_TIMESTAMP
);

-- ── Tabla: usuarios
create table if not exists "users" (
  id            uuid    primary key default uuid_generate_v4(),
  "email"        text    unique not null,
  "passwordHash" text   not null,
  "nombre"       text    not null,
  "apellido"     text    not null,
  "telefono"     text,
  "direccion"    text,
  "rol"          text    default 'cliente',
  "createdAt"    timestamp(3) default CURRENT_TIMESTAMP,
  "updatedAt"    timestamp(3) default CURRENT_TIMESTAMP
);

-- ── Tabla: productos
create table if not exists "products" (
  id              uuid    primary key default uuid_generate_v4(),
  "nombre"          text    not null,
  "slug"            text    unique not null,
  "descripcion"     text    not null,
  "precio"          numeric not null,
  "costoProduccion" numeric not null,
  "stock"           integer default 100,
  "categoriaId"     uuid    references "categories" ("id"),
  "imagenPrincipal" text,
  "imagenesGaleria" text,
  "pesoNeto"        text,
  "ingredientes"    text,
  "beneficios"      text,
  "esNovedad"       boolean default false,
  "esRecomendado"   boolean default false,
  "createdAt"       timestamp(3) default CURRENT_TIMESTAMP,
  "updatedAt"       timestamp(3) default CURRENT_TIMESTAMP
);

-- Índices para productos
create index if not exists idx_products_categoria on "products" ("categoriaId");
create index if not exists idx_products_slug on "products" ("slug");
create index if not exists idx_products_recomendados on "products" ("esRecomendado");
create index if not exists idx_products_novedad on "products" ("esNovedad");

-- ── Tabla: datos nutricionales
create table if not exists "nutrition_facts" (
  id              uuid    primary key default uuid_generate_v4(),
  "productoId"    uuid    unique references "products" ("id") on delete cascade,
  "porcion"        text    not null,
  "calorias"       integer not null,
  "proteinas"      numeric not null,
  "grasas"         numeric not null,
  "carbohidratos"  numeric not null,
  "azucares"       numeric not null,
  "sodio"          numeric not null,
  "fibra"          numeric not null,
  "porcentajeFruta" integer not null,
  "createdAt"       timestamp(3) default CURRENT_TIMESTAMP
);

-- ── Tabla: órdenes
create table if not exists "orders" (
  id              uuid    primary key default uuid_generate_v4(),
  "userId"         uuid    references "users" ("id"),
  "estado"         text    default 'pendiente',
  "total"          numeric not null,
  "direccionEnvio" text,
  "metodoPago"     text,
  "trackingNumber" text,
  "trackingCarrier" text,
  "shippedAt"      timestamp(3),
  "deliveredAt"    timestamp(3),
  "createdAt"      timestamp(3) default CURRENT_TIMESTAMP,
  "updatedAt"      timestamp(3) default CURRENT_TIMESTAMP
);

create index if not exists idx_orders_user on "orders" ("userId");
create index if not exists idx_orders_estado on "orders" ("estado");

-- ── Tabla: items de orden
create table if not exists "order_items" (
  id             uuid    primary key default uuid_generate_v4(),
  "orderId"       uuid    references "orders" ("id") on delete cascade,
  "productId"     uuid    references "products" ("id"),
  "cantidad"      integer not null,
  "precioUnitario" numeric not null,
  "subtotal"      numeric not null
);

create index if not exists idx_order_items_order on "order_items" ("orderId");

-- ── Tabla: reseñas
create table if not exists "reviews" (
  id          uuid    primary key default uuid_generate_v4(),
  "productId"  uuid    references "products" ("id") on delete cascade,
  "userId"      uuid    references "users" ("id"),
  "rating"      integer not null check ("rating" >= 1 and "rating" <= 5),
  "comentario"  text,
  "createdAt"   timestamp(3) default CURRENT_TIMESTAMP,
  unique ("productId", "userId")
);

create index if not exists idx_reviews_product on "reviews" ("productId");

-- ── Tabla: sesiones de carrito
create table if not exists "cart_sessions" (
  id          uuid    primary key default uuid_generate_v4(),
  "sessionId"  text,
  "userId"      uuid    references "users" ("id"),
  "items"       text    not null,
  "expiresAt"   timestamp(3) not null
);

create index if not exists idx_cart_sessions_session on "cart_sessions" ("sessionId");
create index if not exists idx_cart_sessions_user on "cart_sessions" ("userId");

-- ── Row Level Security (RLS) para Supabase
alter table "users" enable row level security;
alter table "orders" enable row level security;
alter table "cart_sessions" enable row level security;

create policy "Usuarios pueden ver su propio perfil" on "users"
  for select using (auth.uid()::text = id::text);

create policy "Usuarios pueden crear su propio perfil" on "users"
  for insert with check (auth.uid()::text = id::text);

-- ── Función de actualización automática de timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new."updatedAt" = CURRENT_TIMESTAMP;
  return new;
end;
$$ language 'plpgsql';

create trigger update_categories_updated_at before update on "categories"
  for each row execute procedure update_updated_at();
create trigger update_users_updated_at before update on "users"
  for each row execute procedure update_updated_at();
create trigger update_products_updated_at before update on "products"
  for each row execute procedure update_updated_at();
create trigger update_orders_updated_at before update on "orders"
  for each row execute procedure update_updated_at();
