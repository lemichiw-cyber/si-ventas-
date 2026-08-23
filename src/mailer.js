import { db } from './db.js';
import { CONFIG } from './config.js';

const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dinero = (n) => `$${Number(n).toFixed(2)}`;

export function plantillaBase(titulo, cuerpoInterno, pieNota = '') {
  return `<!DOCTYPE html>
<html lang="es"><body style="margin:0;padding:0;background:#fdf2f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f7;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #f9d3e3;">
<tr><td style="background:linear-gradient(120deg,#e86a9a,#8e5aa8);padding:26px 30px;text-align:center;">
<div style="font-size:30px;">🍓</div>
<h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;letter-spacing:.5px;">Dulce Encanto</h1>
<p style="margin:4px 0 0;color:#ffe3ef;font-size:12px;">Mermeladas artesanales hechas con amor</p>
</td></tr>
<tr><td style="padding:28px 32px;">
<h2 style="margin:0 0 12px;color:#5c3566;font-size:19px;">${titulo}</h2>
${cuerpoInterno}
${pieNota ? `<p style="color:#a3799b;font-size:12px;margin-top:18px;">${pieNota}</p>` : ''}
</td></tr>
<tr><td style="padding:16px 30px;background:#fdf2f7;text-align:center;">
<p style="margin:0;color:#b98aa9;font-size:11px;line-height:1.6;">
Dulce Encanto · Mermeladas Artesanales<br>Av. de las Flores 123, Quito · WhatsApp +593 99 123 4567<br>
Hechas con amor y fruta fresca ♥
</p></td></tr></table></td></tr></table></body></html>`;
}

function tablaPedido(pedido, items) {
  const filas = items.map((it) => `
    <tr>
      <td style="padding:8px 6px;border-bottom:1px solid #fbe4ee;color:#4a2b47;">🍓 ${esc(it.nombre_producto)} × ${it.cantidad}</td>
      <td align="right" style="padding:8px 6px;border-bottom:1px solid #fbe4ee;color:#4a2b47;">${dinero(it.precio_unitario * it.cantidad)}</td>
    </tr>`).join('');
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
    <tr><th align="left" style="padding:8px 6px;border-bottom:2px solid #f2a7c3;color:#8e5aa8;font-size:12px;text-transform:uppercase;">Producto</th>
        <th align="right" style="padding:8px 6px;border-bottom:2px solid #f2a7c3;color:#8e5aa8;font-size:12px;text-transform:uppercase;">Importe</th></tr>
    ${filas}
    <tr><td align="right" style="padding:6px;color:#7c5b78;">Subtotal:</td><td align="right" style="padding:6px;color:#7c5b78;">${dinero(pedido.subtotal)}</td></tr>
    <tr><td align="right" style="padding:6px;color:#7c5b78;">IVA (${Math.round(0.15 * 100)}%):</td><td align="right" style="padding:6px;color:#7c5b78;">${dinero(pedido.impuesto)}</td></tr>
    <tr><td align="right" style="padding:6px;color:#7c5b78;">Envío:</td><td align="right" style="padding:6px;color:#7c5b78;">${pedido.envio === 0 ? 'Gratis ♥' : dinero(pedido.envio)}</td></tr>
    <tr><td align="right" style="padding:10px 6px;color:#5c3566;font-weight:bold;font-size:16px;">Total:</td>
        <td align="right" style="padding:10px 6px;color:#d94f82;font-weight:bold;font-size:16px;">${dinero(pedido.total)}</td></tr>
  </table>`;
}

const METODOS = { transferencia_bancaria: 'Transferencia bancaria', efectivo: 'Efectivo contra entrega', tarjeta: 'Tarjeta de crédito/débito' };

function correoCliente(pedido, items) {
  const cuerpo = `
    <p style="color:#4a2b47;font-size:15px;">¡Hola, ${esc(pedido.cliente_nombre.split(' ')[0])}! 💕</p>
    <p style="color:#4a2b47;font-size:14px;line-height:1.7;">
      Recibimos tu pedido <strong style="color:#d94f82;">${esc(pedido.numero)}</strong> y ya está en nuestra cocina,
      a punto de convertirse en pura dulzura. Te contamos el resumen:
    </p>
    ${tablaPedido(pedido, items)}
    <div style="background:#fdf2f7;border-radius:14px;padding:14px 18px;margin-top:16px;font-size:13px;color:#7c5b78;">
      <strong style="color:#8e5aa8;">Entrega:</strong> ${esc(pedido.cliente_direccion)}<br>
      <strong style="color:#8e5aa8;">Pago:</strong> ${METODOS[pedido.metodo_pago] || esc(pedido.metodo_pago)}<br>
      ${pedido.notas ? `<strong style="color:#8e5aa8;">Notas:</strong> ${esc(pedido.notas)}<br>` : ''}
    </div>
    <p style="color:#4a2b47;font-size:14px;">Pronto coordinaremos la entrega al teléfono ${esc(pedido.cliente_telefono)}. ¡Gracias por apoyar lo artesanal! 🍑</p>`;
  return { asunto: `Confirmación de pedido ${pedido.numero} · Dulce Encanto`, html: plantillaBase('¡Gracias por tu pedido!', cuerpo, 'Este es un mensaje automático de confirmación. Para cualquier cambio escríbenos por WhatsApp.') };
}

function correoDuenia(pedido, items) {
  const ganancia = redondear(items.reduce((s, i) => s + i.cantidad * 0.8, 0));
  const unidades = items.reduce((s, i) => s + i.cantidad, 0);
  const cuerpo = `
    <p style="color:#4a2b47;font-size:14px;">¡Nueva orden recibida desde la tienda web! 🎉</p>
    <div style="display:inline-block;background:#fff0f6;border:1px dashed #f2a7c3;border-radius:12px;padding:10px 18px;margin-bottom:14px;">
      <span style="font-size:20px;color:#d94f82;font-weight:bold;letter-spacing:1px;">${esc(pedido.numero)}</span>
    </div>
    ${tablaPedido(pedido, items)}
    <div style="background:#f6ecfa;border-radius:14px;padding:14px 18px;margin-top:16px;font-size:13px;color:#5c3566;">
      <strong>Cliente:</strong> ${esc(pedido.cliente_nombre)} · ${esc(pedido.cliente_email)} · ${esc(pedido.cliente_telefono)}<br>
      <strong>Dirección:</strong> ${esc(pedido.cliente_direccion)}<br>
      <strong>Método de pago:</strong> ${METODOS[pedido.metodo_pago] || esc(pedido.metodo_pago)}<br>
      <strong>Frascos vendidos:</strong> ${unidades} · <strong>Ganancia estimada ($0.80/frasco):</strong> ${dinero(ganancia)}
      ${pedido.notas ? `<br><strong>Notas del cliente:</strong> ${esc(pedido.notas)}` : ''}
    </div>
    <p style="color:#7c5b78;font-size:13px;">Gestiona este pedido desde el panel de administración → Sección “Pedidos”.</p>`;
  return { asunto: `🔔 Nuevo pedido ${pedido.numero} · ${dinero(pedido.total)}`, html: plantillaBase(`Nuevo pedido: ${pedido.numero}`, cuerpo) };
}

const redondear = (n) => Math.round(n * 100) / 100;

export function registrarEmail(para, asunto, html, referencia = '') {
  return db.prepare(
    "INSERT INTO emails (para,asunto,cuerpo_html,referencia,estado) VALUES (?,?,?,?,'pendiente') RETURNING id"
  ).get(para, asunto, html, referencia).id;
}

async function entregar(email) {
  if (!CONFIG.EMAIL.RESEND_API_KEY && !CONFIG.EMAIL.SMTP_URL) {
    db.prepare("UPDATE emails SET estado='simulado', enviado_en=datetime('now') WHERE id=?").run(email.id);
    console.log(`\n💌 [EMAIL SIMULADO] → ${email.para}\n   Asunto: ${email.asunto}\n   (Configura RESEND_API_KEY o SMTP_URL en .env para envío real)\n`);
    return true;
  }
  try {
    if (CONFIG.EMAIL.RESEND_API_KEY) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${CONFIG.EMAIL.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: CONFIG.EMAIL.DE, to: [email.para], subject: email.asunto, html: email.cuerpo_html })
      });
      if (!r.ok) throw new Error(`Resend HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    } else {
      let nodemailer;
      try { nodemailer = await import('nodemailer'); }
      catch { throw new Error('SMTP_URL configurado pero falta instalar nodemailer (npm i nodemailer)'); }
      const transporte = nodemailer.createTransport?.(CONFIG.EMAIL.SMTP_URL) ?? nodemailer.default.createTransport(CONFIG.EMAIL.SMTP_URL);
      await transporte.sendMail({ from: CONFIG.EMAIL.DE, to: email.para, subject: email.asunto, html: email.cuerpo_html });
    }
    db.prepare("UPDATE emails SET estado='enviado', error='', enviado_en=datetime('now') WHERE id=?").run(email.id);
    console.log(`📧 Email enviado a ${email.para}: "${email.asunto}"`);
    return true;
  } catch (e) {
    db.prepare("UPDATE emails SET estado='error', error=? WHERE id=?").run(String(e.message || e).slice(0, 500), email.id);
    console.error(`✉️ Error enviando email a ${email.para}:`, e.message || e);
    return false;
  }
}

async function enviarId(id) {
  const email = db.prepare('SELECT * FROM emails WHERE id=?').get(id);
  if (!email) return false;
  return entregar(email);
}

export function reintentarPendientes() {
  const pendientes = db.prepare("SELECT id FROM emails WHERE estado='pendiente'").all();
  for (const e of pendientes) enviarId(e.id);
}

export function notificarNuevoPedido(pedido, items) {
  (async () => {
    const c = correoCliente(pedido, items);
    const d = correoDuenia(pedido, items);
    await enviarId(registrarEmail(pedido.cliente_email, c.asunto, c.html, pedido.numero));
    await enviarId(registrarEmail(CONFIG.EMAIL.ADMIN_EMAIL, d.asunto, d.html, pedido.numero));
  })().catch((e) => console.error('Error en notificación de pedido:', e));
}
