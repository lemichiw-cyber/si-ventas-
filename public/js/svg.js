/* ==========================================
   DULCE ENCANTO — SVG Ilustraciones
   Frutas: fresa, mora, durazno, mango, guayaba, mixta
   Frascos de mermelada con etiquetas coloridas
   Corazones, cintas decorativas, elementos decorativos
   ========================================== */

export const COLORS = {
  fresa: { body:'#FF4D6A', leaves:'#2E7D32', seeds:'#FFB6C1' },
  mora: { body:'#4A148C', leaves:'#2E7D32' },
  durazno: { body:'#FFB74D', leaves:'#2E7D32' },
  mango: { body:'#FFC107', leaves:'#2E7D32' },
  guayaba: { body:'#E91E63', leaves:'#2E7D32' },
  mixta: { body:'#FF6D00', gradientFrom:'#FF4D6A', gradientTo:'#FFC107' }
};

export const frutaSvg = (tipo, size = 24) => {
  const c = COLORS[tipo] || COLORS.fresa;
  const s = size;
  const r = s * 0.3;
  const seedCount = tipo === 'fresa' ? 40 : (tipo === 'mora' ? 30 : 20);
  const seedColor = c.seeds || '#FFB6C1';
  let seeds = '';
  for (let i = 0; i < seedCount; i++) {
    const angle = (i / seedCount) * Math.PI * 2;
    const rad = r * 0.15;
    const x = Math.cos(angle) * (r * 0.6) + s / 2;
    const y = Math.sin(angle) * (r * 0.6) + s * 0.45;
    seeds += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${seedColor}" />`;
  }
  return `
<g transform="translate(${s/2},${s/2})">
  <circle cx="0" cy="0" r="${r}" fill="${c.body}" />
  ${seeds}
  <path d="M0-${r} A${r} ${r} 0 1 0 0${r} A${r} ${r} 0 1 0 0-${r}" stroke="none" fill="${c.body}" />
  ${tipo !== 'mora' ? `<path d="M0-${r*0.7} L0-${r*0.95}" stroke="${c.leaves}" stroke-width="${s*0.08}" fill="none" />` : ''}
  <text x="0" y="${r*0.15}" text-anchor="middle" font-family="Georgia,serif" font-size="${s*0.12}" fill="${c.leaves}">🍓</text>
</g>
`.trim();
};

export const frascoSvg = (tipo, size = 48) => {
  const c = COLORS[tipo] || COLORS.fresa;
  const s = size;
  const rimRadius = s * 0.5;
  const jarHeight = s * 1.1;
  const jarWidth = s * 0.7;
  const lidHeight = s * 0.12;
  const labelHeight = s * 0.25;
  const labelWidth = s * 0.55;
  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <!-- Rim -->
  <circle cx="${s/2}" cy="${s*0.1}" rimRadius="${rimRadius}" fill="#FFF" stroke="#E05C8A" stroke-width="${s*0.04}" />
  <!-- Jar body -->
  <path d="M ${s*0.15} ${s*0.3} C ${s*0.15} ${s*0.7} ${s*0.85} ${s*0.7} ${s*0.85} ${s/2} ${s*1.05} ${s*0.85} ${s*0.7} ${s*0.85} ${s*0.3} Z" fill="${c.body}" />
  <!-- Lid -->
  <path d="M0 ${s*0.1} L${s} ${s*0.1} L${s} ${s*0.12} L0 ${s*0.12} Z" fill="#FFF" stroke="#E05C8A" stroke-width="${s*0.04}" />
  <!-- Label -->
  <rect x="${s/2 - labelWidth/2}" y="${s*0.35}" width="${labelWidth}" height="${labelHeight}" fill="none" stroke="#E05C8A" stroke-width="${s*0.03}" rx="${s*0.04}" />
  <text x="${s/2}" y="${s*0.43}" text-anchor="middle" font-family="Georgia,serif" font-size="${s*0.18}" fill="#E05C8A">🍓</text>
  <!-- Decorative elements -->
  <g fill="#FFD1DC">
    <circle cx="${s/2}" cy="${s*0.85}" r="${s*0.08}" />
    <path d="M ${s/2-s*0.15} ${s*0.8} Q ${s/2} ${s*0.9} ${s/2+s*0.15} ${s*0.8}" stroke="#E05C8A" stroke-width="${s*0.03}" fill="none" />
  </g>
</svg>
`.trim();
};

export const corazonSvg = (size = 20) => {
  const s = size;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 1.11l4.05-3.51L12 3.95l1.7 1.43l4.05 3.51L19.92 1.35C21.5 6.63 22 9.5 22 12.5c0 5.42-5.44 11.28-11.97 12.02l.03.12zM12 4.08l-1.45 1.32C10.55 5.85 9 8.08 9 12.5 9 16.92 11.59 19 14.5 19.05l-3.05.06c-.5.03-1.08.06-1.65.03L7 20.59 5.5 18.07l1.45-1.32C5.47 15.36 8.07 12.33 12 12.25 15.93 12.33 18.55 15.36 12 9.69 12 4.08zM12 2.02l-1.45 1.32C8.55 3.55 5 5.42 5 8.5c0 3.59 4.41 6.38 11.97 11.97l.03.12z"/></svg>`.trim();
};

export const cintaSvg = (ancho = 100, color = '#E05C8A') => {
  return `<svg width="${ancho}" height="30" viewBox="0 0 ${ancho} 30" xmlns="http://www.w3.org/2000/svg"><path d="M0 30 L${ancho} 30 L${ancho} 0 L0 0 Z" fill="${color}" /><text x="${ancho/2}" y="20" text-anchor="middle" font-family="Georgia,serif" font-size="${ancho*0.2}" fill="#fff">DULCE</text></svg>`.trim();
};

export const getSvgKey = (tipo) => {
  const map = { fresa:'fresa', mora:'mora', durazno:'durazno', mango:'mango', guayaba:'guayaba', mixta:'mixta' };
  return map[tipo] || 'fresa';
};