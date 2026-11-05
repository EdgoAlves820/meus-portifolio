/* =====================================================================
   MeAtende AI — utils.js
   Helpers de DOM, formatação, armazenamento e animações.
   ===================================================================== */
import { locale, getLang, money } from './i18n.js';
export { money };

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export function num(v) { return new Intl.NumberFormat(locale()).format(v); }
export function pct(v, d = 0) { return new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: d }).format(v / 100); }

export function fmtDate(d, opts = { day: '2-digit', month: 'short' }) {
  return new Intl.DateTimeFormat(locale(), opts).format(d);
}
/* Data numérica fixa dd/mm/yyyy (independe do idioma) — usada nos agendamentos */
export function fmtDateNum(d) {
  const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
export function fmtWeekday(d) { return new Intl.DateTimeFormat(locale(), { weekday: 'long' }).format(d); }
export function fmtTime(d) { return new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit' }).format(d); }
export function nowTime() { return fmtTime(new Date()); }

export function dateKey(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export function minutesOf(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
export function hhmm(mins) { return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`; }

export function mmss(totalSec) {
  const neg = totalSec < 0; totalSec = Math.abs(totalSec);
  const m = Math.floor(totalSec / 60), s = Math.floor(totalSec % 60);
  return `${neg ? '-' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ---------- Avatares com iniciais e gradientes ---------- */
const AV_COLORS = [
  ['#0E9F6E', '#0B6B4F'], ['#C9A227', '#8a6d1a'], ['#0f766e', '#134e4a'],
  ['#166534', '#14532d'], ['#a16207', '#713f12'], ['#065f46', '#064e3b'],
  ['#374151', '#111827'], ['#4d7c0f', '#3f6212']
];
export function avatar(name, size = 40, extra = '') {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [c1, c2] = AV_COLORS[h % AV_COLORS.length];
  return `<span class="avatar ${extra}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px;background:linear-gradient(135deg,${c1},${c2})">${esc(initials)}</span>`;
}

/* ---------- Persistência ---------- */
const NS = 'meatende.v1.';
export const storage = {
  get(key, fallback) {
    try { const raw = localStorage.getItem(NS + key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem(NS + key, JSON.stringify(val)); } catch {} },
  clearAll() { Object.keys(localStorage).filter(k => k.startsWith(NS)).forEach(k => localStorage.removeItem(k)); }
};

/* ---------- Event bus ---------- */
const listeners = {};
export const bus = {
  on(evt, fn) { (listeners[evt] ||= []).push(fn); return () => bus.off(evt, fn); },
  off(evt, fn) { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); },
  emit(evt, data) { (listeners[evt] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); }
};

export function debounce(fn, ms = 250) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* ---------- Animações ---------- */
export function animateCounters(root = document) {
  $$('[data-count]', root).forEach(node => {
    const target = parseFloat(node.dataset.count);
    const prefix = node.dataset.prefix || '', suffix = node.dataset.suffix || '';
    const isMoney = node.dataset.money === '1';
    const dur = 900, t0 = performance.now();
    const ease = x => 1 - Math.pow(1 - x, 3);
    function frame(t) {
      const p = Math.min(1, (t - t0) / dur), v = target * ease(p);
      node.textContent = prefix + (isMoney ? money(Math.round(v), true) : num(Math.round(v))) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

export function ripple(e) {
  const btn = e.target.closest('.btn, .nav-item, .chip, .icon-btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const r = el(`<span class="ripple"></span>`);
  const size = Math.max(rect.width, rect.height) * 1.1;
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 650);
}

/* ---------- CSV ---------- */
export function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  document.execCommand('copy'); ta.remove();
  return Promise.resolve();
}

export function relTime(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return { key: 'time.now' };
  if (m < 60) return { key: 'time.minAgo', params: { n: m } };
  return { key: 'time.hourAgo', params: { n: Math.floor(m / 60) } };
}

export function greetingKey() {
  const h = new Date().getHours();
  return h < 12 ? 'dash.hello' : h < 18 ? 'dash.helloAfternoon' : 'dash.helloEvening';
}

export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
