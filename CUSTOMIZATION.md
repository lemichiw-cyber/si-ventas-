# 🛠️ CUSTOMIZATION — Personalización avanzada (15 min)

## 1 · Modo catálogo (tienda sin venta online)
`.env`: `CATALOGO_SIN_VENTA=true`
→ Oculta carrito y checkout; los productos muestran "Contáctenos".

## 2 · Multi-moneda
`.env`:
```env
MONEDA_CODIGO=EUR
MONEDA_SIMBOLO=€
MONEDA_POSICION=despues   # €10 en vez de $10
```

## 3 · Cupones de descuento
Seeded automáticamente: `WELCOME10` = −10%.
Crear más (SQL directo por ahora):
```sql
INSERT INTO cupones (codigo,tipo,valor) VALUES ('VERANO5','fijo',5);      -- −$5 fijos
INSERT INTO cupones (codigo,tipo,valor) VALUES ('BLACK20','porcentaje',20);
```
El cliente los aplica en el checkout; el descuento se guarda con el pedido.

## 4 · Emails reales (opcional)
Sin configurar, los emails se SIMULAN en consola. Para enviarlos de verdad:
```env
EMAIL_SIMULADO=false
RESEND_API_KEY=re_xxxxx      # opción A: Resend (https://resend.com)
# o SMTP_URL=smtps://user:pass@smtp.proveedor.com   # opción B
EMAIL_ADMIN=tu@correo.com
```

## 5 · Seguridad XSS
Toda interpolación que venga del usuario debe pasar por `esc()`
(definida en `app.js`). Al añadir vistas nuevas, usa `${esc(valor)}`
para textos y nunca inyectes HTML sin escapar.
