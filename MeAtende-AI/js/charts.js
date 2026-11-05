/* =====================================================================
   MeAtende AI — charts.js
   Gráficos SVG animados, sem dependências externas.
   ===================================================================== */
import { esc } from './utils.js';

const GREEN = '#2D8182', GOLD = '#C9A227', DARK = '#111827', TEAL = '#21575A';

/* ---------- Linha / área ---------- */
export function lineChart({ data, labels = [], height = 190, color = GREEN, money: isMoney = false, id = 'lc' }) {
  const w = 640, h = height, pad = { l: 8, r: 8, t: 16, b: 24 };
  const max = Math.max(...data, 1) * 1.15;
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const pts = data.map((v, i) => [pad.l + (i / Math.max(1, data.length - 1)) * iw, pad.t + ih - (v / max) * ih]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L ${pts[pts.length - 1][0].toFixed(1)} ${pad.t + ih} L ${pts[0][0].toFixed(1)} ${pad.t + ih} Z`;
  const grid = [0.25, 0.5, 0.75].map(f => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${pad.t + ih * f}" y2="${pad.t + ih * f}" class="chart-grid"/>`).join('');
  const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.4" fill="#fff" stroke="${color}" stroke-width="2" class="chart-dot"><title>${esc(labels[i] || '')}: ${data[i]}</title></circle>`).join('');
  const lbls = labels.map((l, i) => {
    if (labels.length > 10 && i % Math.ceil(labels.length / 7) !== 0) return '';
    return `<text x="${pts[i][0]}" y="${h - 6}" text-anchor="middle" class="chart-lbl">${esc(l)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="chart" preserveAspectRatio="none" role="img">
    <defs><linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${grid}
    <path d="${area}" fill="url(#g-${id})" class="chart-area"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" class="chart-line"/>
    ${dots}${lbls}
  </svg>`;
}

/* ---------- Barras ---------- */
export function barChart({ data, labels = [], height = 190, color = GREEN, id = 'bc' }) {
  const w = 640, h = height, pad = { l: 8, r: 8, t: 14, b: 24 };
  const max = Math.max(...data, 1) * 1.15;
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const bw = iw / data.length * 0.58;
  const bars = data.map((v, i) => {
    const x = pad.l + (i + 0.5) * (iw / data.length) - bw / 2;
    const bh = (v / max) * ih;
    return `<rect x="${x}" y="${pad.t + ih - bh}" width="${bw}" height="${bh}" rx="5" fill="${color}" opacity="${0.55 + 0.45 * (v / max)}" class="chart-bar" style="animation-delay:${i * 50}ms"><title>${esc(labels[i] || '')}: ${v}</title></rect>`;
  }).join('');
  const lbls = labels.map((l, i) => {
    if (labels.length > 10 && i % Math.ceil(labels.length / 7) !== 0) return '';
    const x = pad.l + (i + 0.5) * (iw / data.length);
    return `<text x="${x}" y="${h - 6}" text-anchor="middle" class="chart-lbl">${esc(l)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="chart" preserveAspectRatio="none" role="img">
    ${[0.25, 0.5, 0.75].map(f => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${pad.t + ih * f}" y2="${pad.t + ih * f}" class="chart-grid"/>`).join('')}
    ${bars}${lbls}
  </svg>`;
}

/* ---------- Barras horizontais ---------- */
export function hBarChart({ data, labels, color = GREEN, format = v => v }) {
  const max = Math.max(...data, 1);
  return `<div class="hbars">${data.map((v, i) => `
    <div class="hbar-row">
      <span class="hbar-label">${esc(labels[i])}</span>
      <div class="hbar-track"><div class="hbar-fill" style="width:${(v / max * 100).toFixed(1)}%;background:${color};animation-delay:${i * 70}ms"></div></div>
      <span class="hbar-val">${esc(format(v))}</span>
    </div>`).join('')}
  </div>`;
}

/* ---------- Donut ---------- */
export function donut({ value, size = 120, stroke = 12, color = GREEN, track = '#e8f3ee', label = '', sub = '' }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return `<div class="donut-wrap" style="width:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
        transform="rotate(-90 ${size / 2} ${size / 2})" class="donut-fill"/>
    </svg>
    <div class="donut-center"><strong>${esc(label)}</strong>${sub ? `<span>${esc(sub)}</span>` : ''}</div>
  </div>`;
}

/* ---------- Funil ---------- */
export function funnelChart({ stages, values, colors = [GREEN, TEAL, GOLD, '#4d7c0f', DARK] }) {
  const max = Math.max(...values, 1);
  return `<div class="funnel-viz">${stages.map((s, i) => {
    const wPct = 30 + (values[i] / max) * 70;
    return `<div class="funnel-row">
      <div class="funnel-bar" style="width:${wPct}%;background:${colors[i % colors.length]};animation-delay:${i * 80}ms">
        <span>${esc(s)}</span><strong>${values[i]}</strong>
      </div>
      ${i < stages.length - 1 && values[i] ? `<span class="funnel-rate">${Math.round(values[i + 1] / values[i] * 100)}% →</span>` : ''}
    </div>`;
  }).join('')}</div>`;
}

/* ---------- Sparkline ---------- */
export function sparkline(data, color = GREEN, w = 120, h = 36) {
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const pts = data.map((v, i) => [i / (data.length - 1) * w, h - 4 - ((v - min) / Math.max(1, max - min)) * (h - 8)]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" class="sparkline" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/></svg>`;
}

/* ---------- QR Code fake-realista (demo de pareamento) ---------- */
export function qrSVG(seedNum = 7, size = 210) {
  let s = seedNum >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const n = 25, cell = size / n;
  let cells = '';
  const finder = (x, y) => `
    <rect x="${x * cell}" y="${y * cell}" width="${7 * cell}" height="${7 * cell}" fill="#111"/>
    <rect x="${(x + 1) * cell}" y="${(y + 1) * cell}" width="${5 * cell}" height="${5 * cell}" fill="#fff"/>
    <rect x="${(x + 2) * cell}" y="${(y + 2) * cell}" width="${3 * cell}" height="${3 * cell}" fill="#111"/>`;
  const inFinder = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (inFinder(x, y)) continue;
    if (rnd() > 0.52) cells += `<rect x="${(x * cell).toFixed(1)}" y="${(y * cell).toFixed(1)}" width="${(cell * .92).toFixed(1)}" height="${(cell * .92).toFixed(1)}" rx="1" fill="#111"/>`;
  }
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="qr-svg">
    <rect width="${size}" height="${size}" fill="#fff"/>${cells}
    ${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}
    <rect x="${size / 2 - 22}" y="${size / 2 - 22}" width="44" height="44" rx="10" fill="#2D8182"/>
    <path d="M${size / 2 - 10} ${size / 2 - 4} a10 10 0 1 1 4 8 l-6 2 1.6-5.4 a10 10 0 0 1 6.4-4.6z" fill="#fff"/>
  </svg>`;
}
