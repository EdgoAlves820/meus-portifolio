/* =====================================================================
   MeAtende AI — pages/funnel.js
   Kanban de vendas — a IA move os cards conforme a conversa.
   ===================================================================== */
import { t } from '../i18n.js';
import { loc } from '../content.js';
import { icon } from '../icons.js';
import { $, $$, esc, money, bus, avatar, relTime } from '../utils.js';
import { state, moveLead, addLead, deleteLead, funnelTotal, addActivity } from '../store.js';
import { toast, openModal, closeModal, confirmModal, badge, sectionHead, kpiCard, toggleSwitch } from '../ui.js';
import { navigate } from '../app.js';

const COLS = [
  { id: 'lead', color: '#34c98a', ic: 'users' },
  { id: 'qualified', color: '#0f766e', ic: 'message' },
  { id: 'scheduled', color: '#C9A227', ic: 'calendar' },
  { id: 'confirmed', color: '#0E9F6E', ic: 'checkCircle' },
  { id: 'done', color: '#10201a', ic: 'star' },
  { id: 'lost', color: '#9aa8a2', ic: 'xCircle' }
];

let aiLog = [
  { name: 'Ana Beatriz', stage: 'scheduled', ts: Date.now() - 27 * 60000 },
  { name: 'Mariana Costa', stage: 'confirmed', ts: Date.now() - 89 * 60000 },
  { name: 'Pedro Santos', stage: 'done', ts: Date.now() - 4 * 3600e3 }
];

function colHTML(col) {
  const meta = COLS.find(c => c.id === col.id);
  const total = col.items.reduce((s, i) => s + (i.value || 0), 0);
  return `<div class="kanban-col" data-col="${col.id}" style="--col-color:${meta.color}">
    <div class="kanban-head">
      <b><span>${icon(meta.ic, 13)} ${t('funnel.' + col.id)}</span><span class="kanban-count">${col.items.length}</span></b>
      <div class="kanban-total">${money(total, true)}</div>
    </div>
    <div class="kanban-cards" data-drop="${col.id}">
      ${col.items.length ? col.items.map(leadHTML).join('') : `<div class="kanban-empty">${t('funnel.dragHint')}</div>`}
    </div>
  </div>`;
}

function leadHTML(item) {
  return `<div class="lead-card" draggable="true" data-lead="${item.id}">
    <div class="lead-card-top">
      ${avatar(item.name, 30)}
      <b>${esc(item.name)}</b>
      <button class="lead-menu-btn" data-menu="${item.id}">${icon('more', 15)}</button>
    </div>
    <p>${esc(loc(item.desc || ''))}</p>
    <div class="lead-card-foot">
      <span class="lead-value">${money(item.value || 0, true)}</span>
      ${item.chatId ? `<span class="lead-ai">${icon('sparkles', 9)} Sophia</span>` : ''}
    </div>
  </div>`;
}

function statsHTML() {
  const pipeline = funnelTotal(['lead', 'qualified', 'scheduled', 'confirmed']);
  const won = funnelTotal(['done']);
  const totalLeads = state.funnel.reduce((s, c) => s + c.items.length, 0);
  const wonCount = state.funnel.find(c => c.id === 'done').items.length;
  const conv = totalLeads ? Math.round(wonCount / totalLeads * 100) : 0;
  return `
    ${kpiCard({ label: t('funnel.pipeline'), countTo: pipeline, money: true, ic: 'kanban' })}
    ${kpiCard({ label: t('funnel.won'), countTo: won, money: true, ic: 'dollar', tone: 'dark', delta: '+12%' })}
    ${kpiCard({ label: t('funnel.convRate'), value: conv + '%', ic: 'target', tone: 'gold' })}
    ${kpiCard({ label: t('c.total'), value: String(totalLeads), ic: 'users', sub: t('funnel.autoPilot') })}`;
}

function logHTML() {
  return `<div class="card mt-4">
    <div class="card-head">
      <div><div class="card-title">${icon('sparkles', 16)} ${t('funnel.autoPilot')}</div><div class="card-sub">${t('funnel.sub')}</div></div>
      <div class="flex items-center gap-2"><span style="font-size:11.5px;font-weight:700" class="muted">${t('c.active')}</span>${toggleSwitch('funnel-auto', state.funnelAuto !== false)}</div>
    </div>
    <div class="funnel-log" id="funnel-log">${logItemsHTML()}</div>
  </div>`;
}
function logItemsHTML() {
  return aiLog.slice(0, 8).map(l => {
    const rt = relTime(l.ts);
    return `<div class="activity-item"><span class="activity-ic" style="background:var(--gold-100);color:var(--gold-700);border-color:var(--gold-200)">${icon('sparkles', 14)}</span>
      <div class="flex-1"><p>${esc(t('funnel.aiMoved', { name: l.name, stage: t('funnel.' + l.stage) }))}</p><small>${t(rt.key, rt.params)}</small></div></div>`;
  }).join('');
}

function openLeadModal(stage = 'lead') {
  const m = openModal({
    title: t('funnel.newLead'), size: 'sm',
    body: `
      <div class="field"><label>${t('c.name')} *</label><input class="input" id="ld-name" placeholder="Ex: Fernanda Lima"></div>
      <div class="field-row">
        <div class="field"><label>${t('funnel.value')} (R$)</label><input class="input" type="number" id="ld-value" value="200" min="0"></div>
        <div class="field"><label>${t('wa.stage')}</label><select class="select" id="ld-stage">${COLS.map(c => `<option value="${c.id}" ${c.id === stage ? 'selected' : ''}>${t('funnel.' + c.id)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>${t('funnel.interest')}</label><input class="input" id="ld-desc" placeholder="Ex: Interesse em clareamento dental"></div>`,
    footer: `<button class="btn btn-ghost" id="ld-cancel">${t('c.cancel')}</button><button class="btn btn-primary" id="ld-save">${icon('plus', 14)} ${t('c.add')}</button>`,
    onMount: root => {
      root.querySelector('#ld-cancel').onclick = closeModal;
      root.querySelector('#ld-save').onclick = () => {
        const name = root.querySelector('#ld-name').value.trim();
        if (!name) { toast(t('c.required'), 'warn'); return; }
        addLead(root.querySelector('#ld-stage').value, { name, value: Number(root.querySelector('#ld-value').value) || 0, desc: root.querySelector('#ld-desc').value.trim() });
        closeModal(); toast(t('funnel.leadAdded'), 'success');
      };
    }
  });
}

function openLeadMenu(id) {
  const item = state.funnel.flatMap(c => c.items).find(i => i.id === id);
  if (!item) return;
  const currentCol = state.funnel.find(c => c.items.some(i => i.id === id));
  const m = openModal({
    title: item.name, subtitle: loc(item.desc), size: 'sm',
    body: `<div class="field"><label>${t('wa.stage')}</label>
      <select class="select" id="lm-stage">${COLS.map(c => `<option value="${c.id}" ${c.id === currentCol.id ? 'selected' : ''}>${t('funnel.' + c.id)}</option>`).join('')}</select></div>
      ${item.chatId ? `<button class="btn btn-soft w-full" id="lm-chat">${icon('whatsapp', 15)} ${t('queue.open')}</button>` : ''}`,
    footer: `<button class="btn btn-danger btn-sm" id="lm-del">${icon('trash', 13)} ${t('c.delete')}</button>
             <button class="btn btn-primary btn-sm" id="lm-move">${icon('arrowRight', 13)} ${t('c.apply')}</button>`,
    onMount: root => {
      root.querySelector('#lm-chat')?.addEventListener('click', () => { closeModal(); navigate('whatsapp', { chatId: item.chatId }); });
      root.querySelector('#lm-del').onclick = () => { deleteLead(id); closeModal(); toast(t('funnel.leadDeleted'), 'info'); };
      root.querySelector('#lm-move').onclick = () => {
        const to = root.querySelector('#lm-stage').value;
        moveLead(id, to);
        closeModal(); toast(t('funnel.moved', { name: item.name, stage: t('funnel.' + to) }), 'success');
      };
    }
  });
}

export default {
  render() {
    return `
      ${sectionHead(t('funnel.title'), t('funnel.sub'), `
        <span class="chip">${icon('grip', 13)} ${t('funnel.dragHint')}</span>
        <button class="btn btn-primary" id="add-lead">${icon('plus', 16)} ${t('funnel.newLead')}</button>`)}
      <div class="queue-stats" id="funnel-stats">${statsHTML()}</div>
      <div class="kanban" id="kanban">${state.funnel.map(colHTML).join('')}</div>
      ${logHTML()}`;
  },
  mount(root) {
    const rerender = () => {
      $('#kanban').innerHTML = state.funnel.map(colHTML).join('');
      $('#funnel-stats').innerHTML = statsHTML();
      const log = $('#funnel-log'); if (log) log.innerHTML = logItemsHTML();
      wireDnD(); wireMenus();
    };
    const wireMenus = () => {
      $$('[data-menu]', root).forEach(b => b.onclick = e => { e.stopPropagation(); openLeadMenu(b.dataset.menu); });
    };
    const wireDnD = () => {
      let dragId = null;
      $$('.lead-card', root).forEach(card => {
        card.addEventListener('dragstart', e => {
          dragId = card.dataset.lead;
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', dragId);
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
      });
      $$('[data-drop]', root).forEach(zone => {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.closest('.kanban-col').classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => zone.closest('.kanban-col').classList.remove('drag-over'));
        zone.addEventListener('drop', e => {
          e.preventDefault();
          zone.closest('.kanban-col').classList.remove('drag-over');
          const id = e.dataTransfer.getData('text/plain') || dragId;
          const to = zone.dataset.drop;
          const from = state.funnel.find(c => c.items.some(i => i.id === id));
          if (from && from.id !== to) {
            const lead = moveLead(id, to);
            if (lead) toast(t('funnel.moved', { name: lead.name, stage: t('funnel.' + to) }), 'success');
          }
        });
      });
    };
    wireDnD(); wireMenus();
    $('#add-lead')?.addEventListener('click', () => openLeadModal());
    $('#funnel-auto')?.addEventListener('change', e => {
      state.funnelAuto = e.target.checked;
      import('../store.js').then(({ commit }) => commit('funnel'));
      toast(e.target.checked ? t('c.enabled') : t('c.disabled'), 'info');
    });
    const off = bus.on('funnel', data => {
      if (data?.byAI && data.lead) {
        aiLog.unshift({ name: data.lead.name, stage: data.toStage, ts: Date.now() });
        toast(t('funnel.aiMoved', { name: data.lead.name, stage: t('funnel.' + data.toStage) }), 'info', 2600);
      }
      rerender();
    });
    return () => off();
  }
};
