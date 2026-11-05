/* =====================================================================
   MeAtende AI — pages/reports.js
   Relatórios de vendas e atendimento com gráficos SVG + export CSV.
   ===================================================================== */
import { t } from '../i18n.js';
import { loc } from '../content.js';
import { icon } from '../icons.js';
import { $, $$, money, num, fmtDate, downloadCSV } from '../utils.js';
import { state } from '../store.js';
import { toast, sectionHead, kpiCard, badge } from '../ui.js';
import { lineChart, barChart, hBarChart, funnelChart, donut } from '../charts.js';

let period = 7;

function data() { return state.metrics.days.slice(-period); }

function kpisHTML() {
  const d = data();
  const revenue = d.reduce((s, x) => s + x.revenue, 0);
  const chats = d.reduce((s, x) => s + x.chats, 0);
  const bookings = d.reduce((s, x) => s + x.bookings, 0);
  const conv = chats ? Math.round(bookings / chats * 100) : 0;
  return `
    ${kpiCard({ label: t('rep.sales'), countTo: revenue, money: true, ic: 'dollar', delta: '+21%' })}
    ${kpiCard({ label: t('dash.kpi.appts'), countTo: bookings, ic: 'calendar', delta: '+14%' })}
    ${kpiCard({ label: t('rep.funnelConv'), value: conv + '%', ic: 'target', tone: 'gold', sub: `${num(bookings)} / ${num(chats)}` })}
    ${kpiCard({ label: t('rep.satisfaction'), value: '4.8/5', ic: 'star', tone: 'dark', sub: 'CSAT · WhatsApp' })}`;
}

function chartsHTML() {
  const d = data();
  const labels = d.map(x => fmtDate(new Date(x.date + 'T12:00:00'), period > 10 ? { day: '2-digit', month: '2-digit' } : { weekday: 'short' }));
  const stages = ['lead', 'qualified', 'scheduled', 'confirmed', 'done'];
  const funnelVals = stages.map(s => state.funnel.find(c => c.id === s).items.length);
  const specRevenue = {};
  state.appointments.forEach(a => {
    const ty = state.apptTypes.find(x => x.id === a.type);
    if (ty) specRevenue[ty.name.split(' — ')[0]] = (specRevenue[ty.name.split(' — ')[0]] || 0) + ty.price;
  });
  const specSorted = Object.entries(specRevenue).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const avgSla = Math.round(d.reduce((s, x) => s + x.slaOk, 0) / d.length);
  const aiShare = Math.round(d.reduce((s, x) => s + x.aiShare, 0) / d.length);

  return `
    <div class="rep-insight">
      ${icon('sparkles', 22)}
      <div><b>${t('rep.insight')}</b><p>${t('rep.insightText')}</p></div>
    </div>
    <div class="rep-grid">
      <div class="card">
        <div class="card-head"><div class="card-title">${icon('trendUp', 16)} ${t('rep.revenueByDay')}</div>${badge(money(d.reduce((s, x) => s + x.revenue, 0), true), 'green')}</div>
        ${lineChart({ data: d.map(x => x.revenue), labels, id: 'rep-rev' })}
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${icon('message', 16)} ${t('rep.chatsByDay')}</div>${badge(num(d.reduce((s, x) => s + x.chats, 0)), 'gold')}</div>
        ${barChart({ data: d.map(x => x.chats), labels, color: '#C9A227', id: 'rep-chats' })}
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${icon('kanban', 16)} ${t('rep.funnelConv')}</div></div>
        ${funnelChart({ stages: stages.map(s => t('funnel.' + s)), values: funnelVals })}
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${icon('pie', 16)} ${t('rep.bySpecialty')}</div></div>
        ${hBarChart({ labels: specSorted.map(s => loc(s[0])), data: specSorted.map(s => s[1]), format: v => money(v, true) })}
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${icon('clock', 16)} ${t('rep.slaPerf')}</div>${badge(avgSla + '% ' + t('queue.within'), avgSla > 90 ? 'green' : 'gold')}</div>
        ${lineChart({ data: d.map(x => x.slaOk), labels, color: '#0f766e', id: 'rep-sla', height: 160 })}
        <div class="legend mt-2"><span><i style="background:#0f766e"></i> ${t('queue.within')}</span><span><i style="background:#C9A227"></i> ${t('dash.slaMax')}</span></div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${icon('bot', 16)} ${t('rep.aiVsHuman')}</div></div>
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          ${donut({ value: aiShare, label: aiShare + '%', sub: 'Sophia AI', size: 120 })}
          <div style="display:grid;gap:10px;flex:1;min-width:160px">
            <div class="sla-status-row ok" style="margin:0"><span class="left">${icon('sparkles', 14)} Sophia</span><b>${aiShare}%</b></div>
            <div class="sla-status-row" style="margin:0"><span class="left">${icon('user', 14)} ${t('wa.filter.human')}</span><b>${100 - aiShare}%</b></div>
            <div class="sla-status-row" style="margin:0"><span class="left">${icon('zap', 14)} ${t('rep.avgFirst')}</span><b>${state.counters.avgResponse}s</b></div>
          </div>
        </div>
      </div>
    </div>
    <div class="card mt-4">
      <div class="card-head"><div class="card-title">${icon('table', 16)} ${t('c.details')}</div></div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>${t('c.date')}</th><th>${t('rep.sales')}</th><th>${t('nav.whatsapp')}</th><th>${t('dash.kpi.appts')}</th><th>${t('rep.slaPerf')}</th><th>${t('rep.aiVsHuman')}</th></tr></thead>
        <tbody>${[...d].reverse().slice(0, 10).map(x => `
          <tr><td>${fmtDate(new Date(x.date + 'T12:00:00'), { day: '2-digit', month: 'short' })}</td>
          <td><b>${money(x.revenue, true)}</b></td><td>${num(x.chats)}</td><td>${num(x.bookings)}</td>
          <td>${badge(x.slaOk + '%', x.slaOk > 92 ? 'green' : 'gold')}</td><td>${x.aiShare}% Sophia</td></tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
}

export default {
  render() {
    return `
      ${sectionHead(t('rep.title'), t('rep.sub'), `
        <div class="tabs">
          ${[7, 30, 90].map(p => `<button class="tab ${period === p ? 'active' : ''}" data-period="${p}">${t('rep.' + p)}</button>`).join('')}
        </div>
        <button class="btn btn-outline" id="rep-export">${icon('download', 15)} ${t('c.export')}</button>`)}
      <div class="rep-kpis" id="rep-kpis">${kpisHTML()}</div>
      <div id="rep-charts">${chartsHTML()}</div>`;
  },
  mount(root) {
    $$('[data-period]', root).forEach(b => b.onclick = () => {
      period = Number(b.dataset.period);
      $$('[data-period]', root).forEach(x => x.classList.toggle('active', x === b));
      $('#rep-kpis').innerHTML = kpisHTML();
      $('#rep-charts').innerHTML = chartsHTML();
      import('../utils.js').then(({ animateCounters }) => animateCounters($('#rep-kpis')));
    });
    $('#rep-export')?.addEventListener('click', () => {
      const rows = [[t('c.date'), t('rep.sales'), t('nav.whatsapp'), t('dash.kpi.appts'), t('rep.slaPerf'), 'AI %']];
      data().forEach(x => rows.push([x.date, x.revenue, x.chats, x.bookings, x.slaOk + '%', x.aiShare + '%']));
      downloadCSV(`meatende-relatorio-${period}d.csv`, rows);
      toast(t('rep.exported'), 'success');
    });
  }
};
