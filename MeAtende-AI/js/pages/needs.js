/* =====================================================================
   MeAtende AI — pages/needs.js
   "Precisa de você": escalonamentos da IA + problemas em aberto.
   ===================================================================== */
import { t } from '../i18n.js';
import { loc } from '../content.js';
import { icon } from '../icons.js';
import { $, $$, esc, avatar, bus, mmss } from '../utils.js';
import { state, removeIssue, setChatMode, addMessage, commit, SLA_SECONDS } from '../store.js';
import { toast, badge, emptyState, sectionHead } from '../ui.js';
import { navigate } from '../app.js';

function issueCardHTML(issue, i) {
  const waitSec = Math.floor((Date.now() - issue.createdAt) / 1000);
  return `<div class="card issue-card list-in" style="animation-delay:${i * 80}ms">
    <div class="issue-head">
      ${avatar(issue.name, 44)}
      <div class="issue-head-info">
        <b>${esc(issue.name)}</b>
        <small>${icon('clock', 11)} ${t('needs.waiting')} <span data-wait="${issue.id}">${mmss(waitSec)}</span></small>
      </div>
      <div class="confidence-meter">
        <span>${t('needs.aiConfidence')}</span>
        <div class="progress"><div class="progress-fill ${issue.confidence < 50 ? 'red' : 'gold'}" style="width:${issue.confidence}%"></div></div>
        <b>${issue.confidence}%</b>
      </div>
    </div>
    <div class="issue-reason"><b>${t('needs.reason')}:</b> ${esc(loc(issue.reason))}</div>
    <div class="issue-suggested">${esc(loc(issue.suggested))}</div>
    <div class="issue-actions">
      <button class="btn btn-primary btn-sm" data-accept="${issue.id}">${icon('userCheck', 14)} ${t('needs.accept')}</button>
      <button class="btn btn-soft btn-sm" data-reply="${issue.id}">${icon('send', 13)} ${t('needs.useReply')}</button>
      <button class="btn btn-ghost btn-sm" data-return="${issue.id}">${icon('bot', 13)} ${t('needs.return')}</button>
    </div>
  </div>`;
}

function openProblemsHTML() {
  const problems = [];
  state.queue.filter(q => q.seconds < 0).forEach(q => problems.push({
    ic: 'clock', tone: 'red', text: t('ev.sla', { name: q.name, m: Math.round((SLA_SECONDS - q.seconds) / 60) }), page: 'queue', chatId: q.chatId
  }));
  const pending = state.appointments.filter(a => a.status === 'pending');
  if (pending.length) problems.push({ ic: 'calendar', tone: 'gold', text: `${pending.length} × ${t('sched.status.pending')} — ${t('nav.schedule')}`, page: 'schedule' });
  if (!state.integrations.meta.connected) problems.push({ ic: 'plug', tone: 'gold', text: `${t('itg.meta')} — ${t('c.disconnected')}`, page: 'integrations' });
  if (!state.autopilot) problems.push({ ic: 'pause', tone: 'red', text: t('top.autopilotOff'), page: 'settings' });

  return `<div class="card mt-4">
    <div class="card-head"><div class="card-title">${icon('alertCircle', 17)} ${t('needs.openIssues')}</div>${badge(String(problems.length), problems.length ? 'gold' : 'green')}</div>
    ${problems.length ? problems.map(p => `
      <div class="list-row" data-problem="${p.page}" ${p.chatId ? `data-chat="${p.chatId}"` : ''} style="cursor:pointer">
        <span class="notif-ic ni-${p.ic}">${icon(p.ic, 15)}</span>
        <div class="flex-1"><b style="font-size:12.5px">${esc(p.text)}</b></div>
        ${icon('chevronRight', 15)}
      </div>`).join('') : emptyState('checkCircle', t('dash.allClear'))}
  </div>`;
}

export default {
  render() {
    return `
      ${sectionHead(t('needs.title'), t('needs.sub'), badge(`${state.issues.length} ${t('dash.contacts')}`, state.issues.length ? 'gold' : 'green', 'alert'))}
      <div class="needs-grid" id="needs-grid">
        ${state.issues.length ? state.issues.map(issueCardHTML).join('') : `<div style="grid-column:1/-1">${emptyState('sparkles', t('needs.empty'))}</div>`}
      </div>
      ${openProblemsHTML()}`;
  },
  mount(root) {
    const rerender = () => {
      const grid = $('#needs-grid');
      if (grid) {
        grid.innerHTML = state.issues.length ? state.issues.map(issueCardHTML).join('') : `<div style="grid-column:1/-1">${emptyState('sparkles', t('needs.empty'))}</div>`;
        wire();
      }
    };
    const wire = () => {
      $$('[data-accept]', root).forEach(b => b.onclick = () => {
        const issue = state.issues.find(i => i.id === b.dataset.accept);
        if (!issue) return;
        removeIssue(issue.id);
        setChatMode(issue.chatId, 'human');
        const q = state.queue.find(q => q.chatId === issue.chatId);
        if (q) q.status = 'in_service';
        commit('queue');
        toast(t('needs.accepted', { name: issue.name }), 'success');
        navigate('whatsapp', { chatId: issue.chatId });
      });
      $$('[data-reply]', root).forEach(b => b.onclick = () => {
        const issue = state.issues.find(i => i.id === b.dataset.reply);
        if (!issue) return;
        setChatMode(issue.chatId, 'human');
        addMessage(issue.chatId, { sender: 'human', text: loc(issue.suggested) });
        removeIssue(issue.id);
        toast(t('needs.accepted', { name: issue.name }), 'success');
        navigate('whatsapp', { chatId: issue.chatId });
      });
      $$('[data-return]', root).forEach(b => b.onclick = () => {
        const issue = state.issues.find(i => i.id === b.dataset.return);
        if (!issue) return;
        removeIssue(issue.id);
        setChatMode(issue.chatId, 'ai');
        addMessage(issue.chatId, { sender: 'system', text: t('wa.returned', { name: issue.name }) });
        toast(t('needs.returned', { name: issue.name }), 'info');
        rerender();
      });
      $$('[data-problem]', root).forEach(n => n.onclick = () => navigate(n.dataset.problem, n.dataset.chat ? { chatId: n.dataset.chat } : {}));
    };
    wire();

    const timer = setInterval(() => {
      state.issues.forEach(i => {
        const elw = $(`[data-wait="${i.id}"]`);
        if (elw) elw.textContent = mmss(Math.floor((Date.now() - i.createdAt) / 1000));
      });
    }, 1000);
    const off = bus.on('issues', rerender);
    return () => { clearInterval(timer); off(); };
  }
};
