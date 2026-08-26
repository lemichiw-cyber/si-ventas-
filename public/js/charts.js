/* ==========================================
   DULCE ENCANTO — SVG Gráficos Dashboard
   Gráficos SVG puros (sin Canvas, sin Chart.js)
   ========================================== */

export const graficoLineas = (containerId, etiquetas, series) => {
  const w = document.getElementById(containerId).clientWidth || 400;
  const h = 200;
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setStyle ? svg.setStyle('font-family','Quicksand') : svg.setAttribute('font-family','Quicksand');
  document.getElementById(containerId).appendChild(svg);

  const xScale = (i) => margin.left + (innerW / (etiquetas.length - 1)) * i;
  const maxY = Math.max(...series.flatMap(s => s.valores), 0);
  const yScale = (v) => margin.top + innerH - (v / maxY) * innerH;

  // Ejes
  svg.innerHTML += `<g stroke="var(--tinta)" stroke-width="1">
    <line x1="${margin.left}" y1="${margin.left}" x1="${margin.left}" y1="${margin.top + innerH}" />
    <line x1="${margin.left}" y1="${margin.top + innerH}" x2="${margin.left + innerW}" y2="${margin.top + innerH}" />
  </g>`;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = margin.top + innerH - (innerH / 5) * i;
    svg.innerHTML += `<line x1="${margin.left}" y1="${y}" x2="${margin.left + innerW}" y2="${y}" stroke="var(--transparencia)" stroke-width="1"/>`;
  }

  // Dots y labels
  series.forEach((s, si) => {
    s.valores.forEach((v, vi) => {
      svg.innerHTML += `<g fill="var(--tinta)" font-size="10">
        <circle cx="${xScale(vi)}" cy="${yScale(v)}" r="3"/>
        <text x="${xScale(vi)}" y="${yScale(v) - 8}" text-anchor="middle">${v}</text>
      </g>`;
    });
  });

  // Line path
  const pathPoints = series.flatMap((s, si) =>
    s.valores.map((v, vi) => `${xScale(vi)},${yScale(v)}`).join(' ')
  );
  svg.innerHTML += `<g fill="none" stroke="var(--rosa-fuerte)" stroke-width="2">
    <path d="M${pathPoints}" />
  </g>`;

  // Etiquetas X
  etiquetas.forEach((et, i) => {
    const x = xScale(i);
    svg.innerHTML += `<g font-size="10" transform="translate(${x},${margin.top + innerH + 15})">
      <text x="0" y="0" text-anchor="middle" fill="var(--tinta)" font-family="Quicksand">${et}</text>
    </g>`;
  });
};

export const graficoBarras = (containerId, datos, color = '#B23A6B') => {
  const w = document.getElementById(containerId).clientWidth || 400;
  const h = 250;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  document.getElementById(containerId).appendChild(svg);

  const maxVal = Math.max(...datos.map(d => d.valor), 1);
  const barW = (innerW - 20) / datos.length;

  // Ejes
  svg.innerHTML += `<g stroke="var(--tinta)" stroke-width="1">
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + innerH}" />
    <line x1="${margin.left}" y1="${margin.top + innerH}" x2="${margin.left + innerW}" y2="${margin.top + innerH}" />
  </g>`;

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = margin.top + innerH - (innerH / 4) * i;
    svg.innerHTML += `<line x1="${margin.left}" y1="${y}" x2="${margin.left + innerW}" y2="${y}" stroke="var(--transparencia)" stroke-width="1"/>`;
  }

  // Bars
  datos.forEach((d, i) => {
    const x = margin.left + i * barW + barW / 2;
    const h = (d.valor / maxVal) * innerH;
    const y = margin.top + innerH - h;
    svg.innerHTML += `<g>
      <rect x="${x - barW/4}" y="${y}" width="${barW/2}" height="${h}" fill="${color}" rx="4"/>
      <text x="${x}" y="${margin.top - 8}" text-anchor="middle" fill="var(--tinta)" font-family="Quicksand" font-size="11">${d.etiqueta}</text>
      <text x="${x}" y="${margin.top + innerH + 15}" text-anchor="middle" fill="var(--tinta)" font-family="Quicksand" font-size="11">${d.valor}</text>
    </g>`;
  });
};

export const graficoDonut = (containerId, datos) => {
  const w = document.getElementById(containerId).clientWidth || 300;
  const h = 180;
  const radius = Math.min(w, h) / 2 * 0.7;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  document.getElementById(containerId).appendChild(svg);

  const total = datos.reduce((sum, d) => sum + d.valor, 0);
  let startAngle = -Math.PI / 2;

  datos.forEach((d, i) => {
    const sliceAngle = (d.valor / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const x1 = Math.cos(startAngle) * radius;
    const y1 = Math.sin(startAngle) * radius;
    const x2 = Math.cos(endAngle) * radius;
    const y2 = Math.sin(endAngle) * radius;
    const color = i === 0 ? '#B23A6B' : i === 1 ? '#43263F' : '#E05C8A';
    svg.innerHTML += `<path d="M${w/2}h${w/2 - w*0.1}A${radius} ${radius} 0 ${sliceAngle > Math.PI ? 1 : 0} 1 ${x2} ${y2}L${w/2}h${w*0.1 - w*0.2}A${radius} ${radius} 0 0 0 ${w/2 - w*0.1} ${h/2}Z" fill="${color}" />
    <text x="${w/2}" y="${h/2}" text-anchor="middle" fill="#fff" font-family="Quicksand" font-size="14">${d.etiqueta}</text>`;
    startAngle = endAngle;
  });
};