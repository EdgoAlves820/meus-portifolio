/* =====================================================================
   MeAtende AI — pages/aiAgent.js
   Agente de IA: instruções, canais, conhecimento, tom, procedimentos,
   versões e teste — tudo funcional.
   ===================================================================== */
import { t, getLang } from '../i18n.js';
import { loc } from '../content.js';
import { icon } from '../icons.js';
import { $, $$, esc, fmtDate, fmtTime, uid, money } from '../utils.js';
import { state, commit, HOURS, SLA_SECONDS } from '../store.js';
import { toast, openModal, closeModal, confirmModal, badge, sectionHead, toggleSwitch, emptyState } from '../ui.js';
import { sophiaRespond, sophiaMessageText } from '../sophia.js';

/* Etapas de procedimento geradas a partir da configuração real (horários, preços, regras) */
function procSteps(p) {
  const hours = `${t('hours.weekdays')} 07:00–16:30 · ${t('hours.sat')} 08:00–13:00`;
  const min = { __m: Math.min(...state.apptTypes.map(x => x.price)) };
  const disc = 15, sla = Math.round(SLA_SECONDS / 60), provider = state.integrations.payments.provider;
  const map = {
    p1: [t('proc.booking.s1'), t('proc.booking.s2', { hours }), t('proc.booking.s3', { min }), t('proc.booking.s4'), t('proc.booking.s5')],
    p2: [t('proc.reschedule.s1'), t('proc.reschedule.s2'), t('proc.reschedule.s3', { hours }), t('proc.reschedule.s4')],
    p3: [t('proc.cancel.s1'), t('proc.cancel.s2'), t('proc.cancel.s3'), t('proc.cancel.s4')],
    p4: [t('proc.payment.s1', { provider }), t('proc.payment.s2'), t('proc.payment.s3'), t('proc.payment.s4')],
    p5: [t('proc.handoff.s1', { disc }), t('proc.handoff.s2'), t('proc.handoff.s3', { sla }), t('proc.handoff.s4')],
    p6: [t('proc.followup.s1'), t('proc.followup.s2'), t('proc.followup.s3'), t('proc.followup.s4')]
  };
  return map[p.id] || p.steps.map(loc);
}

let tab = 'instructions';
let testMsgs = [];
let testChat = { id: 'test', name: 'Paciente Teste', bookingFlow: {}, memory: { topics: {}, fallback: 0, greeted: false }, messages: [] };

const TABS = [
  { id: 'instructions', ic: 'edit' }, { id: 'channels', ic: 'plug' },
  { id: 'knowledge', ic: 'book' }, { id: 'tone', ic: 'smile' },
  { id: 'procedures', ic: 'branch' }, { id: 'versions', ic: 'history' },
  { id: 'test', ic: 'flask' }
];

/* ---------------- Instruções ---------------- */
function instructionsHTML() {
  return `<div class="ai-grid">
    <div class="card">
      <div class="card-head"><div><div class="card-title">${icon('edit', 16)} ${t('ai.prompt')}</div><div class="card-sub">${t('ai.promptHint')}</div></div></div>
      <textarea class="textarea prompt-area" id="ai-prompt">${esc(state.agentPrompt)}</textarea>
      <div class="flex gap-2 mt-3">
        <button class="btn btn-primary" id="ai-save-prompt">${icon('save', 15)} ${t('c.save')}</button>
        <button class="btn btn-outline" id="ai-publish">${icon('rocket', 15)} ${t('ai.verPublish')}</button>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">${icon('shield', 16)} ${t('ai.guardrails')}</div></div>
      ${Object.keys(state.guardrails).map(g => `
        <div class="guard-row"><span>${t('ai.' + g)}</span>${toggleSwitch('guard-' + g, state.guardrails[g])}</div>`).join('')}
      <div class="rep-insight mt-3" style="margin-bottom:0">
        ${icon('sparkles', 18)}
        <div><b>Sophia</b><p style="font-size:11.5px">${t('ai.deployed')}</p></div>
      </div>
    </div>
  </div>`;
}

/* ---------------- Canais ---------------- */
function channelsHTML() {
  const chans = [
    { id: 'whatsapp', name: 'WhatsApp Business', ic: 'whatsapp', color: '#0E9F6E', desc: state.integrations.qr.connected ? state.integrations.qr.number : t('c.disconnected') },
    { id: 'instagram', name: 'Instagram Direct', ic: 'instagram', color: '#C9A227', desc: '@clinicavidaplena' },
    { id: 'webchat', name: 'Web Chat ' + t('app.name'), ic: 'messageCircle', color: '#10201a', desc: 'widget.site.com.br' },
    { id: 'telegram', name: 'Telegram', ic: 'send', color: '#0f766e', desc: t('c.soon') }
  ];
  return `<div class="card" style="max-width:720px">
    <div class="card-head"><div><div class="card-title">${icon('plug', 16)} ${t('ai.tab.channels')}</div><div class="card-sub">${t('ai.channelsSub')}</div></div></div>
    ${chans.map(c => `
      <div class="channel-card">
        <span class="channel-ic" style="background:${c.color}18;color:${c.color};border:1px solid ${c.color}40">${icon(c.ic, 22)}</span>
        <div class="channel-info"><b>${c.name}</b><small>${esc(c.desc)}</small></div>
        ${badge(state.channels[c.id] ? t('c.active') : t('c.inactive'), state.channels[c.id] ? 'green' : 'gray')}
        ${toggleSwitch('chan-' + c.id, state.channels[c.id])}
      </div>`).join('')}
  </div>`;
}

/* ---------------- Conhecimento ---------------- */
function knowledgeHTML() {
  return `<div class="card">
    <div class="card-head">
      <div><div class="card-title">${icon('book', 16)} ${t('ai.tab.knowledge')}</div><div class="card-sub">${t('ai.kbSub')} · ${state.knowledge.length} ${t('c.total').toLowerCase()}</div></div>
      <button class="btn btn-primary btn-sm" id="kb-add">${icon('plus', 14)} ${t('ai.kbAdd')}</button>
    </div>
    <div id="kb-list">${state.knowledge.map(k => `
      <div class="kb-item">
        <div class="kb-item-head">${badge(loc(k.cat), 'gold')}<b>${esc(loc(k.q))}</b>
          <button class="icon-btn danger" style="width:28px;height:28px" data-kb-del="${k.id}">${icon('trash', 13)}</button></div>
        <p>${esc(loc(k.a))}</p>
      </div>`).join('')}</div>
  </div>`;
}

function openKbModal() {
  const m = openModal({
    title: t('ai.kbAdd'), size: 'md',
    body: `
      <div class="field-row">
        <div class="field"><label>${t('ai.kbQ')} *</label><input class="input" id="kb-q"></div>
        <div class="field"><label>Categoria</label><input class="input" id="kb-cat" placeholder="Preços, Horários…"></div>
      </div>
      <div class="field"><label>${t('ai.kbA')} *</label><textarea class="textarea" id="kb-a" style="min-height:120px"></textarea></div>`,
    footer: `<button class="btn btn-ghost" id="kb-cancel">${t('c.cancel')}</button><button class="btn btn-primary" id="kb-save">${t('c.save')}</button>`,
    onMount: root => {
      root.querySelector('#kb-cancel').onclick = closeModal;
      root.querySelector('#kb-save').onclick = () => {
        const q = root.querySelector('#kb-q').value.trim(), a = root.querySelector('#kb-a').value.trim();
        if (!q || !a) { toast(t('c.required'), 'warn'); return; }
        state.knowledge.unshift({ id: 'k' + uid(), q, a, cat: root.querySelector('#kb-cat').value.trim() || 'Geral' });
        commit('knowledge');
        closeModal(); toast(t('ai.kbAdded'), 'success');
        $('#tab-content').innerHTML = knowledgeHTML(); wireTab();
      };
    }
  });
}

/* ---------------- Tom ---------------- */
function tonePreviewText() {
  const { formality, warmth, emoji } = state.tone;
  const lang = getLang();
  const e = emoji > 60 ? ' 😊💚' : emoji > 30 ? ' 🙂' : '';
  const dict = {
    pt: [formality > 60 ? 'Prezado(a) paciente, agradecemos seu contato.' : warmth > 60 ? 'Oi! Que alegria falar com você!' : 'Olá, tudo bem?',
      'Temos horário amanhã às 09h para sua consulta.', formality > 60 ? 'Podemos confirmar sua presença?' : 'Posso confirmar pra você?' + e],
    en: [formality > 60 ? 'Dear patient, thank you for reaching out.' : warmth > 60 ? 'Hi! So glad to hear from you!' : 'Hello, how are you?',
      'We have a slot tomorrow at 9 AM for your appointment.', formality > 60 ? 'May we confirm your attendance?' : 'Can I confirm it for you?' + e],
    es: [formality > 60 ? 'Estimado(a) paciente, gracias por contactarnos.' : warmth > 60 ? '¡Hola! ¡Qué alegría hablar contigo!' : 'Hola, ¿qué tal?',
      'Tenemos horario mañana a las 09h para tu cita.', formality > 60 ? '¿Podemos confirmar su asistencia?' : '¿Te lo confirmo?' + e],
    fr: [formality > 60 ? 'Cher patient, merci de votre message.' : warmth > 60 ? 'Bonjour ! Ravie de vous parler !' : 'Bonjour, comment allez-vous ?',
      'Nous avons un créneau demain à 9h pour votre consultation.', formality > 60 ? 'Pouvons-nous confirmer votre présence ?' : 'Je vous le confirme ?' + e]
  };
  return dict[lang].join(' ');
}

function toneHTML() {
  const rows = [
    { id: 'formality', label: t('ai.tone.formality'), left: t('ai.tone.casual'), right: t('ai.tone.formal') },
    { id: 'warmth', label: t('ai.tone.warmth'), left: '🧊', right: '🔥' },
    { id: 'length', label: t('ai.tone.length'), left: t('ai.tone.short'), right: t('ai.tone.long') },
    { id: 'emoji', label: t('ai.tone.emoji'), left: '🚫', right: '🎉' }
  ];
  return `<div class="ai-grid">
    <div class="card">
      <div class="card-head"><div><div class="card-title">${icon('smile', 16)} ${t('ai.tab.tone')}</div><div class="card-sub">${t('ai.toneSub')}</div></div></div>
      ${rows.map(r => `
        <div class="tone-row">
          <div class="tone-row-head"><span>${r.label}</span><b class="text-green" data-tone-val="${r.id}">${state.tone[r.id]}%</b></div>
          <input type="range" class="range" min="0" max="100" value="${state.tone[r.id]}" data-tone="${r.id}" style="--fill:${state.tone[r.id]}%">
          <div class="tone-labels"><span>${r.left}</span><span>${r.right}</span></div>
        </div>`).join('')}
      <button class="btn btn-primary" id="tone-save">${icon('save', 15)} ${t('c.save')}</button>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">${icon('eye', 16)} ${t('ai.tone.preview')}</div><span class="pulse-live">${t('c.live')}</span></div>
      <div class="tone-preview">
        <div class="msg msg-sophia" style="max-width:100%"><div class="msg-bubble" id="tone-preview-text">
          <div class="msg-sender">${icon('sparkles', 11)} SOPHIA AI</div><span>${esc(tonePreviewText())}</span>
        </div></div>
      </div>
    </div>
  </div>`;
}

/* ---------------- Procedimentos ---------------- */
function proceduresHTML() {
  return `<div class="card" style="max-width:820px">
    <div class="card-head"><div><div class="card-title">${icon('branch', 16)} ${t('ai.tab.procedures')}</div><div class="card-sub">${t('ai.procSub')}</div></div></div>
    ${state.procedures.map(p => `
      <div class="proc-card ${p.enabled ? '' : 'off'}" data-proc="${p.id}">
        <div class="proc-head" data-proc-toggle="${p.id}">
          ${icon('branch', 16)}<b>${t(p.key)}</b>
          ${badge(p.enabled ? t('c.active') : t('c.inactive'), p.enabled ? 'green' : 'gray')}
          <span onclick="event.stopPropagation()">${toggleSwitch('proc-' + p.id, p.enabled)}</span>
          ${icon('chevronDown', 16, 'proc-chevron')}
        </div>
        <div class="proc-steps">
          ${procSteps(p).map((s, i) => `<div class="proc-step"><span class="proc-step-num">${i + 1}</span><span>${esc(s)}</span></div>`).join('')}
        </div>
      </div>`).join('')}
  </div>`;
}

/* ---------------- Versões ---------------- */
function versionsHTML() {
  return `<div class="card" style="max-width:760px">
    <div class="card-head">
      <div><div class="card-title">${icon('history', 16)} ${t('ai.tab.versions')}</div><div class="card-sub">${t('ai.verSub')}</div></div>
      <button class="btn btn-primary btn-sm" id="ver-publish">${icon('rocket', 14)} ${t('ai.verPublish')}</button>
    </div>
    ${state.versions.map(v => `
      <div class="version-item ${v.active ? 'current' : ''}">
        <span class="version-dot">v${v.v}</span>
        <div class="version-info">
          <b>v${v.v} ${v.active ? badge(t('ai.verCurrent'), 'green', 'checkCircle') : ''}</b>
          <p>${esc(loc(v.note))}</p>
          <small>${fmtDate(new Date(v.ts), { day: '2-digit', month: 'long', year: 'numeric' })}</small>
        </div>
        ${!v.active ? `<button class="btn btn-outline btn-sm" data-restore="${v.id}">${icon('history', 13)} ${t('ai.verRestore')}</button>` : ''}
      </div>`).join('')}
  </div>`;
}

function publishVersion() {
  const m = openModal({
    title: t('ai.verPublish'), size: 'sm',
    body: `<div class="field"><label>${t('ai.verNote')} *</label><input class="input" id="ver-note" placeholder="Ex: ajuste de tom + novos preços"></div>`,
    footer: `<button class="btn btn-ghost" id="ver-cancel">${t('c.cancel')}</button><button class="btn btn-primary" id="ver-ok">${icon('rocket', 14)} ${t('ai.verPublish')}</button>`,
    onMount: root => {
      root.querySelector('#ver-cancel').onclick = closeModal;
      root.querySelector('#ver-ok').onclick = () => {
        const note = root.querySelector('#ver-note').value.trim();
        if (!note) { toast(t('c.required'), 'warn'); return; }
        const last = state.versions[0];
        const next = (parseFloat(last.v) + 0.1).toFixed(1);
        state.versions.forEach(v => v.active = false);
        state.versions.unshift({ id: 'v' + uid(), v: next, note, ts: Date.now(), active: true });
        commit('versions');
        closeModal(); toast(t('ai.verPublished', { v: next }), 'success');
        $('#tab-content').innerHTML = versionsHTML(); wireTab();
      };
    }
  });
}

/* ---------------- Teste ---------------- */
function testHTML() {
  return `<div class="ai-grid">
    <div class="card">
      <div class="card-head">
        <div><div class="card-title">${icon('flask', 16)} ${t('ai.tab.test')}</div><div class="card-sub">${t('ai.testSub')}</div></div>
        <button class="btn btn-outline btn-sm" id="test-reset">${icon('refresh', 13)} ${t('ai.testReset')}</button>
      </div>
      <div class="test-chat">
        <div class="test-msgs" id="test-msgs">
          ${testMsgs.length ? testMsgs.map(m => testMsgHTML(m)).join('') : `<div class="msg msg-sophia"><div class="msg-bubble"><div class="msg-sender">${icon('sparkles', 11)} SOPHIA · ${t('c.test').toUpperCase()}</div>${esc(loc(state.settings.profile.greeting))}</div></div>`}
        </div>
        <form class="flex gap-2" id="test-form">
          <input class="input flex-1" id="test-input" placeholder="${t('ai.testPh')}" autocomplete="off">
          <button type="submit" class="wa-send">${icon('send', 17)}</button>
        </form>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">${icon('zap', 16)} ${t('set.simSub')}</div></div>
      <div style="display:grid;gap:8px">
        ${['wa.filter.ai', 'rep.avgFirst', 'ai.guardrails'].map((k, i) => `
          <div class="sla-status-row ${i === 0 ? 'ok' : ''}" style="margin:0">
            <span class="left">${icon(['sparkles', 'zap', 'shield'][i], 14)} ${t(k)}</span>
            <b>${[t('c.active'), state.counters.avgResponse + 's', Object.values(state.guardrails).filter(Boolean).length + ' ' + t('c.active')][i]}</b>
          </div>`).join('')}
      </div>
      <p class="field-hint mt-3">${icon('info', 12)} ${t('ai.testSub')}</p>
    </div>
  </div>`;
}
function testMsgHTML(m) {
  const cls = m.sender === 'user' ? 'msg-user' : 'msg-sophia';
  const body = m.sender === 'sophia' ? sophiaMessageText(m) : m.text;
  return `<div class="msg ${cls} msg-in"><div class="msg-bubble">${m.sender === 'sophia' ? `<div class="msg-sender">${icon('sparkles', 11)} SOPHIA</div>` : ''}${esc(body)}</div></div>`;
}

/* ---------------- Roteamento de abas ---------------- */
function tabHTML() {
  return { instructions: instructionsHTML, channels: channelsHTML, knowledge: knowledgeHTML, tone: toneHTML, procedures: proceduresHTML, versions: versionsHTML, test: testHTML }[tab]();
}

function wireTab() {
  const root = $('#tab-content');
  /* instruções */
  $('#ai-save-prompt')?.addEventListener('click', () => {
    state.agentPrompt = $('#ai-prompt').value;
    commit('agent'); toast(t('c.saved'), 'success');
  });
  $('#ai-publish')?.addEventListener('click', publishVersion);
  Object.keys(state.guardrails).forEach(g => $('#guard-' + g)?.addEventListener('change', e => {
    state.guardrails[g] = e.target.checked; commit('agent'); toast(t('c.saved'), 'success', 1800);
  }));
  /* canais */
  ['whatsapp', 'instagram', 'webchat', 'telegram'].forEach(c => $('#chan-' + c)?.addEventListener('change', e => {
    state.channels[c] = e.target.checked; commit('agent');
    toast(`${e.target.checked ? t('c.enabled') : t('c.disabled')}: ${c}`, 'info', 2000);
  }));
  /* conhecimento */
  $('#kb-add')?.addEventListener('click', openKbModal);
  $$('[data-kb-del]', root).forEach(b => b.onclick = () => {
    state.knowledge = state.knowledge.filter(k => k.id !== b.dataset.kbDel);
    commit('knowledge'); toast(t('ai.kbDeleted'), 'info');
    $('#tab-content').innerHTML = knowledgeHTML(); wireTab();
  });
  /* tom */
  $$('[data-tone]', root).forEach(r => r.addEventListener('input', e => {
    state.tone[r.dataset.tone] = Number(e.target.value);
    e.target.style.setProperty('--fill', e.target.value + '%');
    $(`[data-tone-val="${r.dataset.tone}"]`).textContent = e.target.value + '%';
    const pv = $('#tone-preview-text span'); if (pv) pv.textContent = tonePreviewText();
  }));
  $('#tone-save')?.addEventListener('click', () => { commit('agent'); toast(t('c.saved'), 'success'); });
  /* procedimentos */
  $$('[data-proc-toggle]', root).forEach(h => h.addEventListener('click', () => h.closest('.proc-card').classList.toggle('open')));
  state.procedures.forEach(p => $('#proc-' + p.id)?.addEventListener('change', e => {
    p.enabled = e.target.checked; commit('agent'); toast(t('c.saved'), 'success', 1800);
  }));
  /* versões */
  $('#ver-publish')?.addEventListener('click', publishVersion);
  $$('[data-restore]', root).forEach(b => b.onclick = () => {
    const v = state.versions.find(x => x.id === b.dataset.restore);
    state.versions.forEach(x => x.active = x.id === v.id);
    commit('versions'); toast(t('ai.verRestored', { v: v.v }), 'success');
    $('#tab-content').innerHTML = versionsHTML(); wireTab();
  });
  /* teste */
  $('#test-reset')?.addEventListener('click', () => { testMsgs = []; testChat = { id: 'test', name: 'Paciente Teste', bookingFlow: {}, memory: { topics: {}, fallback: 0, greeted: false }, messages: [] }; $('#tab-content').innerHTML = testHTML(); wireTab(); });
  $('#test-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#test-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    testMsgs.push({ sender: 'user', text });
    const box = $('#test-msgs');
    box.insertAdjacentHTML('beforeend', testMsgHTML(testMsgs[testMsgs.length - 1]));
    box.insertAdjacentHTML('beforeend', `<div class="typing-bubble msg-in" id="test-typing" style="align-self:flex-start">${icon('sparkles', 12)} <span class="typing-dots"><span></span><span></span><span></span></span></div>`);
    box.scrollTop = box.scrollHeight;
    setTimeout(() => {
      $('#test-typing')?.remove();
      const fakeChat = testChat;
      const res = sophiaRespond(fakeChat, text, { noSideEffects: true });
      testMsgs.push({ sender: 'sophia', text: res.text, ssrc: res.ssrc, skey: res.skey, sparams: res.sparams });
      box.insertAdjacentHTML('beforeend', testMsgHTML(testMsgs[testMsgs.length - 1]));
      box.scrollTop = box.scrollHeight;
    }, 900 + Math.random() * 700);
  });
}

export default {
  render() {
    return `
      ${sectionHead(t('ai.title'), t('ai.sub'), badge(`v${state.versions.find(v => v.active)?.v || '1.0'} · ${t('c.active')}`, 'green', 'sparkles'))}
      <div class="tabs subtabs">
        ${TABS.map(x => `<button class="tab ${tab === x.id ? 'active' : ''}" data-tab="${x.id}">${icon(x.ic, 14)} ${t('ai.tab.' + x.id)}</button>`).join('')}
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
