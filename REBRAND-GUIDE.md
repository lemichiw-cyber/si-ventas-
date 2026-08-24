# 🎨 REBRAND-GUIDE — De "Dulce Encanto" a TU marca en 15 minutos

## Minuto 1–3 · Nombre del negocio (1 archivo)
`src/config.js → CONFIG.NEGOCIO`
```js
nombre: 'TuMarca',
eslogan: 'Tu eslogan aquí',
telefono: '+00 000 000 000',
direccion: 'Tu dirección',
horario: 'Lun–Sáb, 9:00 – 18:00'
```

## Minuto 3–6 · Colores (1 archivo)
`public/css/styles.css` — primeras líneas:
```css
:root {
  --primary: #TU_COLOR;        /* botones, enlaces, acentos */
  --morado-profundo: #TU_OSCURO;
  --rosa-claro: #TU_FONDO_SUAVE;
}
```
Cambia esas 3 variables y toda la paleta sigue.

## Minuto 6–8 · Logo e iconos
| Asset | Archivo |
|-------|---------|
| Logo footer/header | `public/js/svg.js` o reemplaza el emoji 🍓 |
| Favicon | `public/favicon.svg` |
| Iconos PWA | `public/icons/icon-192.png`, `icon-512.png` |

## Minuto 8–11 · Productos demo
Dos opciones:
1. **Panel admin** → Productos → crear/editar/eliminar
2. Seed inicial → `src/db.js → sembrar()` array `prods`

## Minuto 11–13 · Textos de la tienda
- Hero y secciones: `public/js/app.js` funciones `inicio()`, `catalogo()`, `nosotros()`
- Footer: `public/index.html`

## Minuto 13–15 · Moneda, IVA y envío
`.env`:
```env
MONEDA_SIMBOLO=$
MONEDA_POSICION=antes
IVA=0.16
COSTO_ENVIO=3
ENVIO_GRATIS_DESDE=30
```
Reinicia (`node server.js`) y listo.

## ✅ Checklist final
- [ ] Buscar "Dulce Encanto" en el proyecto → solo debe quedar en datos demo viejos
- [ ] Favicon visible en pestaña
- [ ] Pedido de prueba con tu IVA/moneda
