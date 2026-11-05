/* =====================================================================
   MeAtende AI — pages/queue.js
   Fila com SLA de 15 minutos, contagem regressiva ao vivo.
   ===================================================================== */
import { t } from '../i18n.js';
import { loc } from '../content.js';
import { icon } from '../icons.js';
import { $, $$, esc, bus, avatar, mmss } from '../utils.js';
import { state, setChatMode, SLA_SECONDS } from '../store.js';
import { toast, badge, emptyState, sectionHead, kpiCard } from '../ui.js';
import { playTakeover } from '../sound.js';
import { navigate } from '../app.js';

let sortBy = 'sla';
let filter = 'all';
const RING_C = 2 * Math.PI * 26;

function slaTone(seconds) { return seconds < 0 ? 'red' : seconds < 300 ? 'gold' : 'green'; }
function slaColor(seconds) { return seconds < 0 ? '#dc2626' : seconds < 300 ? '#C9A227' : '#0E9F6E'; }

function sortedQueue() {
  let list = [...state.queue];
  if (filter === 'waiting') list = list.filter(q => q.status === 'waiting');
  if (filter === 'needs') list = list.filter(q => q.status === 'needs');
  if (filter === 'breached') list = list.filter(q => q.seconds < 0);
  if (sortBy === 'sla') list.sort((a, b) => a.seconds - b.seconds);
  else list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function ringHTML(q) {
  const frac = Math.max(0, Math.min(1, q.seconds / SLA_SECONDS));
  const off = RING_C * (1 - frac);
  return `<div class="sla-ring" data-ring="${q.id}">
    <svg width="62" height="62" viewBox="0 0 62 62">
      <circle class="ring-bg" cx="31" cy="31" r="26" fill="none" stroke-width="5"/>
      <circle class="ring-fill" cx="31" cy="31" r="26" fill="none" stroke-width="5"
        stroke="${slaColor(q.seconds)}" stroke-dasharray="${RING_C}" stroke-dashoffset="${off}"/>
    </svg>
    <div class="sla-ring-label" style="color:${slaColor(q.seconds)}">
      <span data-sla-time="${q.id}">${mmss(q.seconds)}</span>
      <small>${q.seconds < 0 ? t('queue.expired') : t('queue.remaining')}</small>
    </div>
  </div>`;
}

function queueCardHTML(q, i) {
  const tone = slaTone(q.seconds);
  const statusKey = q.status === 'waiting' ? 'queue.waiting' : q.status === 'needs' ? 'queue.needs' : 'queue.inService';
  const prioKey = 'queue.priority.' + q.priority;
  return `<div class="queue-card ${q.seconds < 0 ? 'critical' : q.seconds < 300 ? 'warning' : ''} list-in" style="animation-delay:${i * 60}ms" data-qcard="${q.id}">
    ${ringHTML(q)}
    <div class="queue-info">
      <b>${avatar(q.name, 30)} ${esc(q.name)}
        ${badge(t(statusKey), q.status === 'needs' ? 'gold' : q.status === 'waiting' ? 'gray' : 'green')}
        ${badge(t(prioKey), q.priority === 'high' ? 'red' : q.priority === 'medium' ? 'gold' : 'gray')}
      </b>
      <small>${esc(loc(q.type))}${q.seconds < 0 ? ` · <b class="text-red">${t('queue.expired')}</b>` : ''}</small>
    </div>
    <div class="queue-actions">
      <button class="btn btn-outline btn-sm" data-open="${q.chatId}">${icon('message', 13)} ${t('queue.open')}</button>
      <button class="btn btn-primary btn-sm" data-take="${q.chatId}">${icon('userCheck', 13)} ${t('wa.takeOver')}</button>
    </div>
  </div>`;
}

function statsHTML() {
  const total = state.queue.length;
  const breached = state.queue.filter(q => q.seconds < 0).length;
  const within = total - breached;
  const avgWait = total ? Math.round(state.queue.reduce((s, q) => s + (SLA_SECONDS - q.seconds), 0) / total / 60) : 0;
  return `
    ${kpiCard({ label: t('queue.total'), value: String(total), ic: 'users' })}
    ${kpiCard({ label: t('queue.within'), value: String(within), ic: 'checkCircle', sub: t('dash.slaMax') })}
    ${kpiCard({ label: t('queue.breached'), value: String(breached), ic: 'alertCircle', tone: 'gold' })}
    ${kpiCard({ label: t('queue.avgWait'), value: avgWait + ' ' + t('c.min'), ic: 'clock', tone: 'dark' })}`;
}

export default {
  render() {
    return `
      ${sectionHead(t('queue.title'), t('queue.sub'), `
        <select class="select" id="queue-sort" style="width:auto">
          <option value="sla" ${sortBy === 'sla' ? 'selected' : ''}>${t('queue.sortSla')}</option>
          <option value="name" ${sortBy === 'name' ? 'selected' : ''}>${t('queue.sortName')}</option>
        </select>`)}
      <div class="queue-stats" id="queue-stats">${statsHTML()}</div>
      <div class="wa-filters mb-4">
        ${['all', 'waiting', 'needs', 'breached'].map(f => `<button class="chip chip-sm ${filter === f ? 'active' : ''}" data-qfilter="${f}">${f === 'all' ? t('c.all') : f === 'waiting' ? t('queue.waiting') : f === 'needs' ? t('queue.needs') : t('queue.breached')}</button>`).join('')}
      </div>
      <div class="queue-list" id="queue-list">
        ${sortedQueue().length ? sortedQueue().map(queueCardHTML).join('') : emptyState('checkCircle', t('queue.empty'))}
      </div>`;
  },
  mount(root) {
    const rerenderList = () => {
      const list = $('#queue-list');
      if (list) {
        list.innerHTML = sortedQueue().length ? sortedQueue().map(queueCardHTML).join('') : emptyState('checkCircle', t('queue.empty'));
        wireCards();
      }
      const stats = $('#queue-stats');
      if (stats) stats.innerHTML = statsHTML();
    };
    const wireCards = () => {
      $$('[data-open]', root).forEach(b => b.onclick = () => navigate('whatsapp', { chatId: b.dataset.open }));
      $$('[data-take]', root).forEach(b => b.onclick = () => {
        setChatMode(b.dataset.take, 'human');
        const q = state.queue.find(x => x.chatId === b.dataset.take);
        if (q) q.status = 'in_service';
        playTakeover();
        toast(t('wa.tookOver', { name: q?.name || '' }), 'info');
        navigate('whatsapp', { chatId: b.dataset.take });
      });
    };
    wireCards();
    $('#queue-sort')?.addEventListener('change', e => { sortBy = e.target.value; rerenderList(); });
    $$('[data-qfilter]', root).forEach(b => b.onclick = () => {
      filter = b.dataset.qfilter;
      $$('[data-qfilter]', root).forEach(x => x.classList.toggle('active', x === b));
      rerenderList();
    });

    /* Tick de 1s: atualiza só os anéis e rótulos, sem re-render */
    const offSla = bus.on('sla', () => {
      state.queue.forEach(q => {
        const timeEl = $(`[data-sla-time="${q.id}"]`);
        const ringEl = $(`[data-ring="${q.id}"] .ring-fill`);
        const card = $(`[data-qcard="${q.id}"]`);
        if (timeEl) {
          timeEl.textContent = mmss(q.seconds);
          timeEl.parentElement.style.color = slaColor(q.seconds);
          const small = timeEl.parentElement.querySelector('small');
          if (small) small.textContent = q.seconds < 0 ? t('queue.expired') : t('queue.remaining');
        }
        if (ringEl) {
          const frac = Math.max(0, Math.min(1, q.seconds / SLA_SECONDS));
          ringEl.style.strokeDashoffset = RING_C * (1 - frac);
          ringEl.style.stroke = slaColor(q.seconds);
        }
        if (card) {
          card.classList.toggle('critical', q.seconds < 0);
          card.classList.toggle('warning', q.seconds >= 0 && q.seconds < 300);
        }
      });
      const stats = $('#queue-stats');
      if (stats && state.queue.some(q => q.seconds === 0 || q.seconds === 300)) stats.innerHTML = statsHTML();
    });
    return () => offSla();
  }
};
