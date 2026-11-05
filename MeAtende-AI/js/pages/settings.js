/* =====================================================================
   MeAtende AI — pages/settings.js
   Perfil, playbook, piloto automático, simulador e respostas rápidas.
   ===================================================================== */
import { t, getLang, getRates, setRates } from '../i18n.js';
import { loc } from '../content.js';
import { icon } from '../icons.js';
import { $, $$, esc, uid } from '../utils.js';
import { state, commit, resetDemo } from '../store.js';
import { toast, openModal, closeModal, confirmModal, badge, sectionHead, toggleSwitch } from '../ui.js';
import { sophiaRespond } from '../sophia.js';

let tab = 'profile';
const TABS = [
  { id: 'profile', ic: 'user' }, { id: 'playbook', ic: 'book' },
  { id: 'autopilot', ic: 'zap' }, { id: 'simulator', ic: 'flask' }, { id: 'quick', ic: 'messageCircle' }
];

/* ---------------- Perfil ---------------- */
function profileHTML() {
  const p = state.settings.profile;
  return `<div class="ai-grid">
    <div class="card">
      <div class="card-head"><div class="card-title">${icon('user', 16)} ${t('set.tab.profile')}</div></div>
      <div class="field"><label>${t('set.clinicName')}</label><input class="input" id="pf-name" value="${esc(p.name)}"></div>
      <div class="field-row">
        <div class="field"><label>${t('set.segment')}</label><input class="input" id="pf-segment" value="${esc(loc(p.segment))}"></div>
        <div class="field"><label>${t('c.phone')}</label><input class="input" id="pf-phone" value="${esc(p.phone)}"></div>
      </div>
      <div class="field"><label>${t('set.address')}</label><input class="input" id="pf-address" value="${esc(p.address)}"></div>
      <div class="field"><label>${t('set.greeting')}</label><textarea class="textarea" id="pf-greeting">${esc(loc(p.greeting))}</textarea></div>
      <button class="btn btn-primary" id="pf-save">${icon('save', 15)} ${t('c.save')}</button>
    </div>
    <div class="dash-col">
      <div class="card">
        <div class="card-head"><div class="card-title">${icon('clock', 16)} ${t('set.hoursEdit')}</div></div>
        <div class="hours-edit-row" style="grid-template-columns:1fr auto"><span>${t('hours.weekdays')}</span><b class="text-green">07:00 – 16:30</b></div>
        <div class="hours-edit-row" style="grid-template-columns:1fr auto"><span>${t('hours.sat')}</span><b class="text-green">08:00 – 13:00</b></div>
        <div class="hours-edit-row" style="grid-template-columns:1fr auto"><span>${t('hours.sun')}</span><b class="text-red">${t('hours.closed')}</b></div>
        <p class="field-hint mt-2">${icon('sparkles', 12)} ${t('hours.ai247')}</p>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${icon('dollar', 16)} ${t('set.exchange')}</div></div>
        <p class="field-hint mb-3">${t('set.exchangeHint')}</p>
        <div class="field-row">
          <div class="field"><label>${t('set.rateUsd')}</label><input class="input" id="rate-usd" type="number" step="0.001" min="0" value="${getRates().usd}"></div>
          <div class="field"><label>${t('set.rateEur')}</label><input class="input" id="rate-eur" type="number" step="0.001" min="0" value="${getRates().eur}"></div>
        </div>
        <button class="btn btn-primary btn-sm" id="rate-save">${icon('save', 14)} ${t('c.save')}</button>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${icon('refresh', 16)} Demo</div></div>
        <p style="font-size:12px" class="mb-3">Resetar dados de demonstração (conversas, agenda, funil, notificações).</p>
        <button class="btn btn-outline btn-sm" id="pf-reset">${icon('refresh', 14)} ${t('c.reset')} demo</button>
      </div>
    </div>
  </div>`;
}

/* ---------------- Playbook ---------------- */
function playbookHTML() {
  return `<div class="card" style="max-width:760px">
    <div class="card-head"><div><div class="card-title">${icon('book', 16)} ${t('set.tab.playbook')}</div><div class="card-sub">${t('set.playbookSub')}</div></div></div>
    ${['pb1', 'pb2', 'pb3', 'pb4', 'pb5', 'pb6'].map(k => `
      <div class="guard-row">
        <span class="flex items-center gap-2">${icon('checkCircle', 15, 'text-green')} ${t('set.' + k)}</span>
        ${toggleSwitch('pb-' + k, state.settings.playbook[k])}
      </div>`).join('')}
  </div>`;
}

/* ---------------- Piloto automático ---------------- */
function autopilotHTML() {
  const a = state.settings.autopilot;
  const modes = [
    { id: 'full', ic: 'rocket', label: t('set.auto.full') },
    { id: 'hybrid', ic: 'userCheck', label: t('set.auto.hybrid') },
    { id: 'manual', ic: 'eye', label: t('set.auto.manual') }
  ];
  return `<div class="ai-grid">
    <div class="card">
      <div class="card-head"><div><div class="card-title">${icon('zap', 16)} ${t('set.auto.mode')}</div><div class="card-sub">${t('set.autoSub')}</div></div>
        ${toggleSwitch('ap-master', state.autopilot)}</div>
      <div class="mode-cards">
        ${modes.map(mo => `
          <div class="mode-card ${a.mode === mo.id ? 'sel' : ''}" data-mode="${mo.id}">
            <span class="mode-check">${icon('checkCircle', 18)}</span>
            ${icon(mo.ic, 22)}<b>${mo.label.split(' — ')[0]}</b><p>${mo.label.split(' — ')[1] || ''}</p>
          </div>`).join('')}
      </div>
      <div class="tone-row">
        <div class="tone-row-head"><span>${t('set.auto.confidence')}</span><b class="text-green" id="ap-conf-val">${a.confidence}%</b></div>
        <input type="range" class="range" min="40" max="95" value="${a.confidence}" id="ap-conf" style="--fill:${((a.confidence - 40) / 55 * 100)}%">
      </div>
      ${[['offhours', 'set.auto.offhours'], ['followup', 'set.auto.followup'], ['remind', 'set.auto.remind']].map(([k, label]) => `
        <div class="guard-row"><span>${t(label)}</span>${toggleSwitch('ap-' + k, a[k])}</div>`).join('')}
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">${icon('bot', 16)} Sophia</div>${badge(state.autopilot ? t('c.active') : t('c.inactive'), state.autopilot ? 'green' : 'gray')}</div>
      <div class="sophia-stats">
        <div class="sophia-stat"><b>${state.counters.solvedPct}%</b><small>${t('dash.kpi.solved')}</small></div>
        <div class="sophia-stat"><b>${state.counters.avgResponse}s</b><small>${t('rep.avgFirst')}</small></div>
        <div class="sophia-stat"><b>${a.confidence}%</b><small>${t('needs.aiConfidence')}</small></div>
        <div class="sophia-stat"><b>24/7</b><small>WhatsApp</small></div>
      </div>
      <p class="field-hint mt-3">${icon('info', 12)} ${t('set.autoSub')}</p>
    </div>
  </div>`;
}

/* ---------------- Simulador ---------------- */
const SCENARIOS = [
  { id: 'price', ic: 'dollar', key: 'set.sim.price' },
  { id: 'urgent', ic: 'alert', key: 'set.sim.urgent' },
  { id: 'book', ic: 'calendar', key: 'set.sim.book' },
  { id: 'complaint', ic: 'xCircle', key: 'set.sim.complaint' }
];
let scenario = 'book';
let simRunning = false;

const SCENARIO_MSGS = {
  price: { pt: ['Olá! Quanto custa a limpeza dentária?'], en: ['Hi! How much is a dental cleaning?'], es: ['¡Hola! ¿Cuánto cuesta la limpieza dental?'], fr: ['Bonjour ! Combien coûte le détartrage ?'] },
  urgent: { pt: ['Estou com uma dor no peito muito forte, o que faço?'], en: ['I have very strong chest pain, what do I do?'], es: ['Tengo un dolor de pecho muy fuerte, ¿qué hago?'], fr: ['J’ai une douleur thoracique très forte, que faire ?'] },
  book: { pt: ['Oi, quero marcar uma consulta de odontologia', '{slot}'], en: ['Hi, I want to book a dental appointment', '{slot}'], es: ['Hola, quiero agendar una cita de odontología', '{slot}'], fr: ['Bonjour, je veux réserver en dentisterie', '{slot}'] },
  complaint: { pt: ['Fui cobrado duas vezes pela consulta, quero um estorno!'], en: ['I was charged twice, I want a refund!'], es: ['¡Me cobraron dos veces, quiero un reembolso!'], fr: ['On m’a facturé deux fois, je veux un remboursement !'] }
};

function simulatorHTML() {
  return `<div class="ai-grid">
    <div class="card">
      <div class="card-head"><div><div class="card-title">${icon('flask', 16)} ${t('set.tab.simulator')}</div><div class="card-sub">${t('set.simSub')}</div></div></div>
      <div class="scenario-grid">
        ${SCENARIOS.map(s => `
          <button class="scenario-card ${scenario === s.id ? 'sel' : ''}" data-scenario="${s.id}">
            <span class="scenario-ic">${icon(s.ic, 18)}</span>
            <span><b>${t(s.key)}</b><small>Sophia AI</small></span>
          </button>`).join('')}
      </div>
      <button class="btn btn-primary w-full" id="sim-run">${icon('play', 15)} ${t('set.simRun')}</button>
      <div class="sim-chat" id="sim-chat"></div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">${icon('info', 16)} ${t('c.details')}</div></div>
      <p style="font-size:12.5px;line-height:1.7">${t('set.simSub')}.<br><br>
      ${icon('checkCircle', 13, 'text-green')} ${t('ai.g2')}<br>
      ${icon('checkCircle', 13, 'text-green')} ${t('ai.g3')}<br>
      ${icon('checkCircle', 13, 'text-green')} ${t('set.pb1')}</p>
    </div>
  </div>`;
}

function simMsgHTML(sender, text) {
  const cls = sender === 'user' ? 'msg-user' : 'msg-sophia';
  return `<div class="msg ${cls} msg-in"><div class="msg-bubble">${sender === 'sophia' ? `<div class="msg-sender">${icon('sparkles', 11)} SOPHIA</div>` : ''}${esc(text)}</div></div>`;
}

async function runScenario() {
  if (simRunning) return;
  simRunning = true;
  const box = $('#sim-chat');
  const btn = $('#sim-run');
  box.innerHTML = '';
  btn.disabled = true;
  btn.innerHTML = `${icon('refresh', 15, 'spin')} ${t('set.simRunning')}`;
  const lang = getLang();
  const msgs = SCENARIO_MSGS[scenario][lang] || SCENARIO_MSGS[scenario].pt;
  const fakeChat = { id: 'sim', name: 'Paciente Simulado', bookingFlow: {}, memory: { topics: {}, fallback: 0, greeted: false }, messages: [] };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  for (let raw of msgs) {
    await wait(600);
    let text = raw;
    if (raw === '{slot}') {
      const slots = fakeChat.lastSlots;
      text = slots?.[0]?.label || '09:00';
    }
    box.insertAdjacentHTML('beforeend', simMsgHTML('user', text));
    box.scrollTop = box.scrollHeight;
    box.insertAdjacentHTML('beforeend', `<div class="typing-bubble msg-in" id="sim-typing" style="align-self:flex-end">${icon('sparkles', 12)} <span class="typing-dots"><span></span><span></span><span></span></span></div>`);
    box.scrollTop = box.scrollHeight;
    await wait(1100 + Math.random() * 600);
    $('#sim-typing')?.remove();
    const res = sophiaRespond(fakeChat, text, { noSideEffects: true });
    fakeChat.lastSlots = res.slots;
    box.insertAdjacentHTML('beforeend', simMsgHTML('sophia', res.text));
    box.scrollTop = box.scrollHeight;
  }
  await wait(400);
  box.insertAdjacentHTML('beforeend', `<div class="msg msg-system msg-in"><div class="msg-bubble">✅ ${t('set.simDone')}</div></div>`);
  box.scrollTop = box.scrollHeight;
  toast(t('set.simDone'), 'success');
  btn.disabled = false;
  btn.innerHTML = `${icon('play', 15)} ${t('set.simRun')}`;
  simRunning = false;
}

/* ---------------- Respostas rápidas ---------------- */
function quickHTML() {
  return `<div class="card" style="max-width:820px">
    <div class="card-head">
      <div><div class="card-title">${icon('messageCircle', 16)} ${t('set.tab.quick')}</div><div class="card-sub">${t('set.quickSub')}</div></div>
      <button class="btn btn-primary btn-sm" id="qr-add">${icon('plus', 14)} ${t('set.quickAdd')}</button>
    </div>
    ${state.quickReplies.map(q => `
      <div class="quick-item">
        <span class="quick-trigger">${esc(q.trigger)}</span>
        <p>${esc(loc(q.text))}</p>
        <button class="icon-btn" style="width:28px;height:28px" data-qr-edit="${q.id}">${icon('edit', 13)}</button>
        <button class="icon-btn danger" style="width:28px;height:28px" data-qr-del="${q.id}">${icon('trash', 13)}</button>
      </div>`).join('')}
  </div>`;
}

function openQuickModal(existing = null) {
  const m = openModal({
    title: existing ? t('c.edit') : t('set.quickAdd'), size: 'md',
    body: `
      <div class="field"><label>${t('set.quickTrigger')} *</label><input class="input" id="qk-trigger" value="${esc(existing?.trigger || '')}" placeholder="preço|valor|quanto"></div>
      <div class="field"><label>${t('set.quickText')} *</label><textarea class="textarea" id="qk-text">${esc(existing ? loc(existing.text) : '')}</textarea></div>
      <p class="field-hint">${icon('info', 12)} Separe gatilhos com | — a resposta aparece no chat quando o cliente usar a palavra.</p>`,
    footer: `<button class="btn btn-ghost" id="qk-cancel">${t('c.cancel')}</button><button class="btn btn-primary" id="qk-save">${t('c.save')}</button>`,
    onMount: root => {
      root.querySelector('#qk-cancel').onclick = closeModal;
      root.querySelector('#qk-save').onclick = () => {
        const trigger = root.querySelector('#qk-trigger').value.trim();
        const text = root.querySelector('#qk-text').value.trim();
        if (!trigger || !text) { toast(t('c.required'), 'warn'); return; }
        if (existing) { existing.trigger = trigger; existing.text = text; }
        else state.quickReplies.unshift({ id: 'qr' + uid(), trigger, text });
        commit('quick');
        closeModal(); toast(t('set.quickAdded'), 'success');
        $('#tab-content').innerHTML = quickHTML(); wireTab();
      };
    }
  });
}

/* ---------------- Abas ---------------- */
function tabHTML() {
  return { profile: profileHTML, playbook: playbookHTML, autopilot: autopilotHTML, simulator: simulatorHTML, quick: quickHTML }[tab]();
}

function wireTab() {
  const root = $('#tab-content');
  /* perfil */
  $('#pf-save')?.addEventListener('click', () => {
    const p = state.settings.profile;
    p.name = $('#pf-name').value.trim() || p.name;
    p.segment = $('#pf-segment').value.trim();
    p.phone = $('#pf-phone').value.trim();
    p.address = $('#pf-address').value.trim();
    p.greeting = $('#pf-greeting').value.trim();
    commit('settings'); toast(t('c.saved'), 'success');
    document.querySelector('.tb-user-info b').textContent = p.name;
  });
  $('#rate-save')?.addEventListener('click', () => {
    setRates(parseFloat($('#rate-usd').value), parseFloat($('#rate-eur').value));
    toast(t('set.rateSaved'), 'success');
  });
  $('#pf-reset')?.addEventListener('click', () => confirmModal({
    title: t('c.reset') + ' demo', message: 'Todos os dados voltarão ao estado inicial. Continuar?', danger: true,
    confirmLabel: t('c.reset'), onConfirm: () => { resetDemo(); toast(t('c.saved'), 'success'); }
  }));
  /* playbook */
  ['pb1', 'pb2', 'pb3', 'pb4', 'pb5', 'pb6'].forEach(k => $('#pb-' + k)?.addEventListener('change', e => {
    state.settings.playbook[k] = e.target.checked; commit('settings'); toast(t('c.saved'), 'success', 1600);
  }));
  /* piloto */
  $('#ap-master')?.addEventListener('change', e => {
    state.autopilot = e.target.checked; commit('autopilot');
    toast(state.autopilot ? t('top.activated') : t('top.paused'), state.autopilot ? 'success' : 'warn');
  });
  $$('[data-mode]', root).forEach(c => c.onclick = () => {
    state.settings.autopilot.mode = c.dataset.mode; commit('settings');
    $$('[data-mode]', root).forEach(x => x.classList.toggle('sel', x === c));
    toast(t('c.saved'), 'success', 1600);
  });
  $('#ap-conf')?.addEventListener('input', e => {
    state.settings.autopilot.confidence = Number(e.target.value);
    $('#ap-conf-val').textContent = e.target.value + '%';
    e.target.style.setProperty('--fill', ((e.target.value - 40) / 55 * 100) + '%');
  });
  $('#ap-conf')?.addEventListener('change', () => { commit('settings'); toast(t('c.saved'), 'success', 1600); });
  ['offhours', 'followup', 'remind'].forEach(k => $('#ap-' + k)?.addEventListener('change', e => {
    state.settings.autopilot[k] = e.target.checked; commit('settings'); toast(t('c.saved'), 'success', 1600);
  }));
  /* simulador */
  $$('[data-scenario]', root).forEach(c => c.onclick = () => {
    scenario = c.dataset.scenario;
    $$('[data-scenario]', root).forEach(x => x.classList.toggle('sel', x === c));
  });
  $('#sim-run')?.addEventListener('click', runScenario);
  /* respostas rápidas */
  $('#qr-add')?.addEventListener('click', () => openQuickModal());
  $$('[data-qr-edit]', root).forEach(b => b.onclick = () => openQuickModal(state.quickReplies.find(q => q.id === b.dataset.qrEdit)));
  $$('[data-qr-del]', root).forEach(b => b.onclick = () => {
    state.quickReplies = state.quickReplies.filter(q => q.id !== b.dataset.qrDel);
    commit('quick'); toast(t('set.quickDeleted'), 'info');
    $('#tab-content').innerHTML = quickHTML(); wireTab();
  });
}

export default {
  render() {
    return `
      ${sectionHead(t('set.title'), t('set.sub'))}
      <div class="tabs subtabs">
        ${TABS.map(x => `<button class="tab ${tab === x.id ? 'active' : ''}" data-tab="${x.id}">${icon(x.ic, 14)} ${t('set.tab.' + x.id)}</button>`).join('')}
      </div>
      <div id="tab-content">${tabHTML()}</div>`;
  },
  mount(root) {
    $$('[data-tab]', root).forEach(b => b.onclick = () => {
      tab = b.dataset.tab;
      $$('[data-tab]', root).forEach(x => x.classList.toggle('active', x === b));
      $('#tab-content').innerHTML = tabHTML();
      wireTab();
    });
    wireTab();
  }
};
