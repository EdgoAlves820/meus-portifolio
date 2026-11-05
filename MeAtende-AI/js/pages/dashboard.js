/* =====================================================================
   MeAtende AI — pages/dashboard.js
   O dia da empresa em uma tela.
   ===================================================================== */
import { t } from '../i18n.js';
import { loc, tt } from '../content.js';
import { icon } from '../icons.js';
import { $, $$, esc, bus, money, num, avatar, fmtDate, fmtWeekday, dateKey, relTime, greetingKey } from '../utils.js';
import { state, todayAppointments, funnelTotal, isOpenNow } from '../store.js';
import { kpiCard, badge, emptyState } from '../ui.js';
import { lineChart, donut, hBarChart } from '../charts.js';
import { navigate } from '../app.js';

const STAGE_COLORS = { lead: '#34c98a', qualified: '#0f766e', scheduled: '#C9A227', confirmed: '#0E9F6E', done: '#10201a', lost: '#9aa8a2' };

function heroHTML() {
  const d = new Date();
  return `<div class="dash-hero">
    <div>
      <h1>${t(greetingKey())}, ${esc(state.settings.profile.name.replace('Clínica ', ''))}! <span class="wave">👋</span></h1>
      <p>${t('dash.subtitle')}</p>
      <span class="dash-hero-date">${icon('calendarDays', 13)} ${fmtWeekday(d)}, ${fmtDate(d, { day: '2-digit', month: 'long', year: 'numeric' })} · ${isOpenNow() ? '🟢 ' + t('hours.openNow') : '🌙 ' + t('hours.closedNow')}</span>
    </div>
    <div class="dash-hero-actions">
      <button class="btn hero-btn gold" data-go="whatsapp">${icon('whatsapp', 16)} ${t('dash.openWhats')}</button>
      <button class="btn hero-btn" data-go="internal">${icon('cpu', 16)} ${t('dash.askManager')}</button>
      <button class="btn hero-btn" data-go="ai">${icon('bot', 16)} ${t('dash.trainAi')}</button>
    </div>
  </div>`;
}

function kpisHTML() {
  const appts = todayAppointments();
  return `<div class="kpi-grid">
    ${kpiCard({ label: t('dash.kpi.appts'), countTo: appts.length, sub: '+25% ' + t('c.vsYesterday'), ic: 'calendar', delta: '+25%' })}
    ${kpiCard({ label: t('dash.kpi.chats'), countTo: state.counters.chatsToday, sub: t('dash.sophiaHandled', { n: state.counters.solvedPct }), ic: 'message', delta: '+18%' })}
    ${kpiCard({ label: t('dash.kpi.sla'), value: state.counters.avgResponse + 's', sub: t('dash.slaMax'), ic: 'clock', tone: 'gold', delta: '-32%' })}
    ${kpiCard({ label: t('dash.kpi.revenue'), countTo: state.counters.revenueMonth, money: true, sub: t('dash.byAi'), ic: 'dollar', tone: 'dark', delta: '+21%' })}
  </div>`;
}

let revPeriod = 7;
const REV_PERIODS = [3, 7, 15, 30, 90, 180, 365, 1825];
/* Agrega dias em buckets p/ manter o gráfico legível em períodos longos */
function revSeries(days) {
  const n = days.length;
  const maxPts = n > 730 ? 20 : 30;
  const dateOf = d => new Date(d.date + 'T12:00:00');
  if (n <= maxPts) {
    return {
      data: days.map(d => d.revenue),
      labels: days.map(d => fmtDate(dateOf(d), n > 15 ? { day: '2-digit', month: '2-digit' } : { weekday: 'short' }))
    };
  }
  const size = Math.ceil(n / maxPts);
  const data = [], labels = [];
  for (let i = 0; i < n; i += size) {
    const chunk = days.slice(i, i + size);
    data.push(chunk.reduce((s, d) => s + d.revenue, 0));
    const first = dateOf(chunk[0]);
    labels.push(n > 365 ? fmtDate(first, { month: 'short', year: '2-digit' }) : fmtDate(first, { day: '2-digit', month: '2-digit' }));
  }
  return { data, labels };
}
function revenueCardHTML() {
  const days = state.metrics.days.slice(-revPeriod);
  const { data, labels } = revSeries(days);
  const opts = REV_PERIODS.map(p => `<option value="${p}" ${p === revPeriod ? 'selected' : ''}>${t('rev.period.' + p)}</option>`).join('');
  return `<div class="card" id="rev-card">
    <div class="card-head">
      <div><div class="card-title">${icon('trendUp', 17)} ${t('dash.revenue')}</div>
      <div class="card-sub">${money(days.reduce((s, d) => s + d.revenue, 0))} · ${num(days.reduce((s, d) => s + d.bookings, 0))} ${t('rev.bookings')}</div></div>
      <div class="flex items-center gap-2">
        <select class="input" id="rev-period" style="width:auto;padding:6px 10px;font-size:12px" aria-label="${t('dash.revenue')}">${opts}</select>
        <span class="pulse-live">${t('c.live')}</span>
      </div>
    </div>
    ${lineChart({ data, labels, id: 'dash-rev' })}
  </div>`;
}
function wireRev(root) {
  const sel = $('#rev-period', root);
  if (!sel) return;
  sel.addEventListener('change', () => {
    revPeriod = parseInt(sel.value, 10) || 7;
    const card = $('#rev-card', root);
    if (card) card.outerHTML = revenueCardHTML();
    wireRev(root);
  });
}

function todayCardHTML() {
  const appts = todayAppointments();
  return `<div class="card">
    <div class="card-head">
      <div><div class="card-title">${icon('calendarDays', 17)} ${t('dash.next')}</div>
      <div class="card-sub">${appts.length} ${t('sched.todayCount')}</div></div>
      <button class="btn btn-soft btn-sm" data-go="schedule">${t('c.viewAll')} ${icon('arrowRight', 13)}</button>
    </div>
    ${appts.length ? appts.slice(0, 6).map(a => {
      const type = state.apptTypes.find(x => x.id === a.type);
      const doc = { d1: 'Dr. Carlos Eduardo', d2: 'Dra. Juliana Paes', d3: 'Dra. Renata Vieira', d4: 'Dr. André Matos', d5: 'Dra. Paula Nunes' }[a.doctor] || '';
      return `<div class="appt-row">
        <span class="appt-time">${a.time}</span>
        <span class="appt-type-dot" style="background:${type?.color || '#0E9F6E'}"></span>
        <div class="appt-info"><b>${esc(a.patient)}</b><small>${esc(loc(type?.name || ''))} · ${esc(doc)}</small></div>
        ${badge(t(`sched.status.${a.status}`), a.status === 'confirmed' ? 'green' : a.status === 'pending' ? 'gold' : 'dark')}
      </div>`;
    }).join('') : emptyState('calendar', t('dash.noAppts'))}
  </div>`;
}

function sophiaCardHTML() {
  return `<div class="card sophia-card">
    <div class="card-head"><div class="card-title">${icon('bot', 17)} Sophia</div>${badge(state.autopilot ? t('c.active') : t('c.inactive'), state.autopilot ? 'green' : 'gray', state.autopilot ? 'zap' : 'pause')}</div>
    ${donut({ value: state.counters.solvedPct, label: state.counters.solvedPct + '%', sub: t('dash.kpi.solved'), size: 128 })}
    <div class="sophia-stats">
      <div class="sophia-stat"><b>${state.counters.avgResponse}s</b><small>${t('rep.avgFirst')}</small></div>
      <div class="sophia-stat"><b>${state.issues.length}</b><small>${t('nav.needs')}</small></div>
      <div class="sophia-stat"><b>${num(state.counters.chatsToday)}</b><small>${t('dash.kpi.chats')}</small></div>
      <div class="sophia-stat"><b>24/7</b><small>WhatsApp</small></div>
    </div>
  </div>`;
}

function queueHealthHTML() {
  const breached = state.queue.filter(q => q.seconds < 0).length;
  const within = state.queue.length - breached;
  return `<div class="card">
    <div class="card-head"><div><div class="card-title">${icon('clock', 17)} ${t('dash.queueHealth')}</div><div class="card-sub">${t('dash.queueSub')}</div></div></div>
    <div id="dash-sla-rows">${slaRowsHTML()}</div>
    <button class="btn btn-primary w-full mt-2" data-go="whatsapp">${icon('message', 15)} ${t('dash.openWhats')}</button>
  </div>`;
}
function slaRowsHTML() {
  const breached = state.queue.filter(q => q.seconds < 0).length;
  const risk = state.queue.filter(q => q.seconds >= 0 && q.seconds < 300).length;
  return `
    <div class="sla-status-row ${breached ? 'bad' : 'ok'}"><span class="left">${icon(breached ? 'alertCircle' : 'checkCircle', 15)} ${t('dash.underControl')}</span><b data-sla-breach>${breached} ${t('dash.breached')}</b></div>
    <div class="sla-status-row ${risk ? 'warn' : ''}"><span class="left">${icon('clock', 15)} ${t('queue.warning')}</span><b data-sla-risk>${risk}</b></div>
    <div class="sla-status-row ${state.issues.length ? 'warn' : 'ok'}"><span class="left">${icon('alert', 15)} ${t('dash.attention')}</span><b>${state.issues.length} ${t('dash.contacts')}</b></div>`;
}

function needsPreviewHTML() {
  return `<div class="card">
    <div class="card-head"><div class="card-title">${icon('alert', 17)} ${t('dash.needsYou')}</div>
      <button class="btn btn-soft btn-sm" data-go="needs">${t('c.viewAll')}</button></div>
    ${state.issues.length ? state.issues.slice(0, 2).map(i => `
      <div class="list-row" data-go="needs" style="cursor:pointer">
        ${avatar(i.name, 36)}
        <div class="flex-1"><b style="font-size:12.5px">${esc(i.name)}</b><p style="font-size:11px" class="truncate">${esc(loc(i.reason))}</p></div>
        ${icon('chevronRight', 15)}
      </div>`).join('') : emptyState('checkCircle', t('dash.allClear'))}
  </div>`;
}

function activityHTML() {
  return `<div class="card">
    <div class="card-head"><div><div class="card-title">${icon('activity', 17)} ${t('dash.live')}</div><div class="card-sub">${t('dash.liveSub')}</div></div><span class="pulse-live">${t('c.live')}</span></div>
    <div class="activity-feed" id="activity-feed">${activityItemsHTML()}</div>
  </div>`;
}
function activityItemsHTML() {
  return state.activity.slice(0, 10).map((a, i) => {
    const rt = relTime(a.ts);
    return `<div class="activity-item list-in" style="animation-delay:${i * 40}ms">
      <span class="activity-ic">${icon(a.icon || 'zap', 14)}</span>
      <div class="flex-1"><p>${esc(tt(a.key, a.params))}</p><small>${t(rt.key, rt.params)}</small></div>
    </div>`;
  }).join('');
}

function funnelSnapHTML() {
  const stages = ['lead', 'qualified', 'scheduled', 'confirmed', 'done'];
  const max = Math.max(...stages.map(s => state.funnel.find(c => c.id === s).items.length), 1);
  return `<div class="card">
    <div class="card-head"><div class="card-title">${icon('kanban', 17)} ${t('dash.funnelSnap')}</div>
      <button class="btn btn-soft btn-sm" data-go="funnel">${icon('arrowRight', 13)}</button></div>
    <div class="mini-funnel">
      ${stages.map(s => {
        const col = state.funnel.find(c => c.id === s);
        return `<div class="mini-funnel-row">
          <div class="bar" style="width:${Math.max(18, col.items.length / max * 100)}%;background:${STAGE_COLORS[s]}">${col.items.length}</div>
          <span>${t('funnel.' + s)}</span>
          <span class="val">${money(col.items.reduce((a, i) => a + i.value, 0), true)}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function topSpecHTML() {
  const counts = {};
  state.appointments.forEach(a => {
    const name = loc(state.apptTypes.find(x => x.id === a.type)?.name.split(' — ')[0] || 'Outros');
    counts[name] = (counts[name] || 0) + 1;
  });
  const extra = { [loc('Odontologia')]: 14, [loc('Dermatologia')]: 11, [loc('Cardiologia')]: 6, [loc('Nutrição')]: 5 };
  Object.entries(extra).forEach(([k, v]) => counts[k] = (counts[k] || 0) + v);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return `<div class="card">
    <div class="card-head"><div class="card-title">${icon('star', 17)} ${t('dash.topSpec')}</div></div>
    ${hBarChart({ labels: sorted.map(s => s[0]), data: sorted.map(s => s[1]), color: '#C9A227' })}
  </div>`;
}

export default {
  render() {
    return `
      ${heroHTML()}
      ${kpisHTML()}
      <div class="dash-grid">
        <div class="dash-col">${revenueCardHTML()}${todayCardHTML()}</div>
        <div class="dash-col">${sophiaCardHTML()}${queueHealthHTML()}${needsPreviewHTML()}</div>
      </div>
      <div class="dash-grid-3">${activityHTML()}${funnelSnapHTML()}${topSpecHTML()}</div>`;
  },
  mount(root) {
    $$('[data-go]', root).forEach(n => n.addEventListener('click', () => navigate(n.dataset.go)));
    wireRev(root);
    const offActivity = bus.on('activity', () => { const f = $('#activity-feed'); if (f) f.innerHTML = activityItemsHTML(); });
    const offSla = bus.on('sla', () => { const r = $('#dash-sla-rows'); if (r) r.innerHTML = slaRowsHTML(); });
    const offIssues = bus.on('issues', () => { const r = $('#dash-sla-rows'); if (r) r.innerHTML = slaRowsHTML(); });
    const offChats = bus.on('chats', () => {
      const k = $('.kpi-grid');
      if (k) {
        k.outerHTML = kpisHTML();
        import('../utils.js').then(({ animateCounters }) => animateCounters($('.kpi-grid')));
      }
    });
    return () => { offActivity(); offSla(); offIssues(); offChats(); };
  }
};
