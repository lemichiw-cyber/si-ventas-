# Dulce Encanto — Tienda Online de Mermeladas Artesanales

## 🍓 Descripción Completa

**Dulce Encanto** es una tienda en línea full-stack de mermeladas artesanales hechas con fruta fresca. El sistema completo incluye:

- **Catálogo de productos** con 6 sabores de mermelada artesanal
- **Carrito de compras** con funcionalidad completa (agregar/quitar, modificar cantidades, calcular subtotal, impuestos y total)
- **Panel de administración** protegido con todas las funciones necesarias
- **Sistema de notificaciones por email** cuando un cliente hace un pedido
- **Actualizaciones de stock en tiempo real** mediante Server-Sent Events (SSE)
- **Panel de administración** con gráficos de ventas y control de inventario

## 🚀 Características Principales

### Frontend (SPA - Single Page Application)
- Diseño visual dulce, artesanal y atractivo con paleta de colores rosa, morado y blanco
- Ilustraciones personalizadas de frutas (fresa, mora, durazno) y frascos de mermelada
- Animaciones suaves al agregar productos al carrito (efecto "fly-to-cart")
- Contador de items en el icono del carrito
- Diseño responsive (adaptable a móvil y desktop)
- Secciones: Inicio, Catálogo, Producto, Carrito, Checkout, Pedidos, Nosotros, Contacto
- Panel de login/registro de usuarios

### Backend (Zero-Dependency Node.js + SQLite)
- Sin dependencias externas instalables (funciona con Node.js nativo)
- Base de datos SQLite persistente con schemas completos
- API RESTful completa para todos los operaciones
- Autenticación de usuarios (clientes y administrador) con scrypt
- Tokens JWT firmados con HMAC-SHA256
- Server-Sent Events (SSE) para actualizaciones de stock en tiempo real
- Sistema de notificaciones por email (Resend API / nodemailer / modo simulado)

### Panel de Administración
- **Dashboard**: KPIs (ventas totales, unidades vendidas, ganancia estimada $0.80/frasco)
- **Gráficos de ventas**: ventas por los últimos 14 días, top sabores, métodos de pago, estados de pedido
- **Control de inventario**: ver stock, actualizar stock (con alertas automáticas cuándo < 5 unidades)
- **Gestión de productos**: agregar/editar/eliminar productos del catálogo
- **Ver pedidos**: lista completa con filtro por estado, detalle y actualización de estado
- **Clientes**: lista de usuarios con historial de pedidos y gasto total
- **Notificaciones**: lista de emails enviados, posibilidad de reenviar

### Flujo de Pedidos
1. Cliente registra o hace login
2. Agrega productos al carrito con selector de cantidad
3. Checkout con datos del cliente y método de pago
4. Sistema valida stock transaccionalmente
5. Disminuye stock automáticamente y registra movimiento
6. Envía notificaciones por email (cliente + dueña)
7. Muestra confirmación de pedido con número de orden
8. El admin puede rastrear el estado (pendiente → pagado → enviado → entregado)

### Datos Precargados
- **6 sabores de mermelada**: Fresa Clásica, Mora Andina, Durazno Dorado, Mango Tropical, Frutal Mixta, Guayaba del Campo
- **Precios**: $2.50 por frasco, costo $1.70, ganancia $0.80 por frasco
- **Usuarios**: Admin (admin@dulceencanto.com / Admin123*) y Cliente Demo (cliente@demo.com / Cliente123*)
- **12 pedidos históricos** distribuidos para mostrar el dashboard con datos reales

## 📦 Instalación y Ejecución

### Requisitos Previos
- Node.js versión >= 22.5 (por las funciones de SQLite y scrypt)

### Pasos de Instalación

1. **Clonar el repositorio o descargar los archivos**:
   ```bash
   git clone https://github.com/tu-usuario/dulce-encanto.git
   cd dulce-encanto
   ```

2. **Verificar Node.js versión**:
   ```bash
   node --version
   # Debe ser 22.5 o superior
   ```

3. **Ejecutar la aplicación**:
   ```bash
   # Opción A: Desarrollo con recarga automática
   npm run dev
   
   # Opción B: Modo producción
   npm start
   ```

4. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

### Primera Ejecución (Sembrado de Datos)
Al primer levantamiento, el sistema automáticamente:
- Crea las tablas de la base de datos
- Inserta 2 usuarios (admin + cliente demo)
- Inserta 6 productos con stock inicial
- Registra 12 pedidos históricos para datos de prueba

### Credenciales de Acceso

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Admin** | admin@dulceencanto.com | Admin123* |
| **Cliente** | cliente@demo.com | Cliente123* |

### Acceso al Panel de Administración
1. Iniciar sesión con `admin@dulceencanto.com / Admin123*`
2. El panel está disponible en la navegación superior o en la ruta `/admin`
3. Todas las funciones están accesibles desde el menú lateral

## 🌐 Endpoints de la API

### Públicos (sin autenticación)
- `GET /api/productos` - Catálogo de productos (puede filtrar por `destacados=1` o búsqueda `q=`)
- `GET /api/productos/:slugOrId` - Ficha de producto
- `GET /api/config` - Configuración del negocio (IVA, costo envío, etc.)
- `POST /api/auth/registro` - Registrarse como cliente
- `POST /api/auth/login` - Login de cliente
- `GET /api/auth/me` - Perfil del usuario (requiere token)
- `POST /api/pedidos` - Realizar checkout/pedido
- `GET /api/pedidos/:numero` - Ver detalle de un pedido

### Con Autenticación (token en header `Authorization: Bearer <token>`)
- `GET /api/auth/me` - Perfil del usuario

### Administración (requiere rol `admin`)
- `GET /api/admin/resumen` - Dashboard con KPIs y gráficos
- `GET /api/admin/pedidos` - Listar pedidos (con filtro por estado)
- `PATCH /api/admin/pedidos/:id/estado` - Actualizar estado de pedido
- `POST /api/admin/productos` - Crear nuevo producto
- `PUT /api/admin/productos/:id` - Editar producto
- `DELETE /api/admin/productos/:id` - Eliminar/archivar producto
- `PATCH /api/admin/productos/:id/stock` - Actualizar stock
- `GET /api/admin/movimientos` - Movimientos de stock recientes
- `GET /api/admin/clientes` - Lista de clientes
- `GET /api/admin/emails` - Lista de emails de notificación
- `POST /api/admin/emails/:id/reenviar - Reenviar email de notificación

### SSE (Server-Sent Events)
- `GET /api/eventos` - Actualizaciones de stock en tiempo real (público)
- `GET /api/admin/eventos` - Todos los eventos (admin con token)
- Eventos broadcast: `stock`, `alerta`, `pedido`, `heartbeat`

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** v22.5+ (características nativas: SQLite, crypto, Web Streams)
- **SQLite** a través de `node:sqlite` (base de datos relacional incrustada)
- **crypto** scrypt para hashing de contraseñas
- **HMAC-SHA256** para firmar tokens JWT
- **EventSource** / SSE para tiempo real
- Arquitectura zero-dependency (no hay `npm install` necesario)

### Frontend
- **HTML5** semántico con paleta rosa-morado-blanco
- **CSS3** con variables CSS para colores corporativos
- **Vanilla JavaScript** (ES modules) - sin frameworks externos
- **SVG illustrations** personalizadas (frutas, frascos, corazones, cintas)
- **CSS Animations** para efectos de hover, fly-to-cart, reveal on scroll
- **IntersectionObserver** para revelado en scroll

### Características Técnicas Destacadas
- **Zero external dependencies**: Todo funciona con Node.js nativo
- **SQLite en memoria de archivo**: `data/dulce-encanto.db` persistente
- **SSE en tiempo real**: Actualizaciones de stock sin polling
- **Email asincrónico**: Modo Resend API / nodemailer / simulado
- **Scrypt password hashing**: Memory-hard función cryptográfica
- **HMAC-SHA256 tokens**: Tokens firmados sin librerías externas

## ⚙️ Configuración (.env)

Copiar `.env.example` a `.env` y personalizar si es necesario:

```
PUERTO=3000
JWT_SECRETO=cambiar-esto-por-una-frase-larga-y-secreta
TOKEN_HORAS=168

IVA=0.15
COSTO_ENVIO=1.50
ENVIO_GRATIS_DESDE=15

EMAIL_DE="Dulce Encanto <pedidos@dulceencanto.com>"
EMAIL_ADMIN=duena@dulceencanto.com

# Opción A: API Resend (recomendada para emails REALES)
RESEND_API_KEY=

# Opción B: SMTP con nodemailer (npm i nodemailer si se quiere usar)
SMTP_URL=

# true = guarda emails en BD sin enviarlos (modo demostración por defecto)
EMAIL_SIMULADO=true
```

### Personalizar la Base de Datos
Si es necesario recrear la base de datos desde cero:
```bash
rm data/dulce-encanto.db
# Reiniciar el servidor para volver a sembrar datos
npm run dev
```

## 📱 Navegadores Compatibles
- Chrome/Firefox/Edge (versiones recientes)
- Safari (versión moderna)
- Dispositivos móviles (iOS y Android)

## 📊 Estructura de Archivos

```
dulce-encanto/
├── package.json          # Scripts y configuración Node
├── server.js           # Servidor HTTP principal
├── src/
│   ├── config.js       # Configuración (.env loading)
│   ├── db.js           # Schema SQLite + sembrado de datos
│   ├── auth.js         # hashPassword, verificarPassword, firmarToken, verificarToken
│   ├── http.js         # Clase Router, HttpError, leerCuerpo
│   ├── api.js        # Todas las rutas REST + SSE logic
│   └── mailer.js       # Notificaciones por email (Resend/nodemailer/simulado)
├── data/
│   └── dulce-encanto.db # Base de datos SQLite (creada automáticamente)
├── public/
│   ├── index.html      # Shell HTML principal
│   ├── favicon.svg    # Ícono de la marca
│   ├── css/
│   │   └── styles.css # Estilos dulces/rosa-morado
│   └── js/
│       ├── app.js      # SPA routing, state, views
│       ├── svg.js      # Ilustraciones SVG (frutas, frascos, decoración)
│       └── charts.js   # Gráficos SVG para dashboard admin
├── .env.example       # Ejemplo de configuración
└── .gitignore
```

## 🐛 Problemas Conocidos y Notas

### Módulos de Autenticación
El sistema de auth usa `firmarToken` y `verificarPassword` desde `auth.js`. En algunos entornos de ejecución, puede haber problemas de módulo ESM/CJS. La solución típica es asegurarse de que `package.json` tenga `"type": "module"` (ya incluido) y que las importaciones sean consistentes.

Si aparece el error `firmarToken is not defined`, verificar que:
1. `package.json` tenga `"type": "module"`
2. No haya archivos `.js` sueltos que interfieran
3. Reiniciar el servidor (`pkill node; npm run dev`)

### Personalización de Email
Para enviar emails reales:
1. Crear cuenta en [resend.com](https://resend.com)
2. Verificar dominio (o usar `onboarding@resend.dev` temporal)
3. Pegar `RESEND_API_KEY` en el archivo `.env`
4. El sistema cambiará `EMAIL_SIMULADO` a `false` y enviará emails reales

### Modo Demo/Simulado
Si no se configura `RESEND_API_KEY` ni `SMTP_URL`, el sistema:
- Guarda los emails en la base de datos con estado `pendiente`/`simulado`
- Muestra un box de consola con el contenido del email
- Es perfecto para desarrollo y demostraciones sin costo de servicio de email

### Cambiar Puerto
Modificar `PUERTO` en el archivo `.env` o pasar como variable de entorno:
```bash
PORT=4000 npm start
```

## 🎨 Diseño Visual

### Paleta de Colores
- **Rosa claro**: `#FDEEF3`
- **Rosa**: `#F2A7C3`
- **Rosa fuerte**: `#E05C8A`
- **Morado**: `#9B6BB3`
- **Morado profundo**: `#5C3566`
- **Blanco/Crema**: `#FFF9FB`
- **Tinta/texto**: `#4A2B47`

### Tipografía
- **Logo/Heading**: Pacifico (Google Font - estilo caligráfico dulce)
- **Cuerpo**:system UI, con fallback a la sistema del dispositivo

### Ilustraciones Personalizadas
- **Frascos de mermelada**: 6 colores diferentes (fresa, mora, durazno, mango, mixta, guayaba)
- **Frutas**: Fresa, Mora (blackberry), Durazno (peach)
- **Decoración**: Corazones, rayas, cinta decorativa, brillos sutiles
- **Animaciones**: Efecto "fly-to-cart" cuando se agrega un producto, bounce del contador, reveal on scroll

## 🤝 Contribuir

1. Hacer un fork del repositorio
2. Crear una rama para la feature (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Dulce Encanto - Hechas con amor y fruta fresca!** 🍓💕