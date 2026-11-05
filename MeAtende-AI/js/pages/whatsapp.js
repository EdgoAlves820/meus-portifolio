/* =====================================================================
   MeAtende AI — pages/whatsapp.js
   Conversas em um só lugar: Sophia respondendo, agendando e vendendo.
   ===================================================================== */
import { t, getLang } from '../i18n.js';
import { loc, locList } from '../content.js';
import { icon } from '../icons.js';
import { $, $$, esc, bus, avatar, fmtTime, money, debounce } from '../utils.js';
import { state, getChat, addMessage, setChatMode, commit, moveLead, addNotification } from '../store.js';
import { toast, badge, emptyState, sectionHead } from '../ui.js';
import { sophiaRespond, detectIntent, sophiaMessageText } from '../sophia.js';
import { playTakeover, playBack, playAlert } from '../sound.js';
import { navigate } from '../app.js';

let activeId = null;
let filter = 'all';
let search = '';
let typingChats = new Set();
let chatSlots = {}; // slots oferecidos por conversa
let sendAs = 'client';

const SIM_CLIENT = {
  pt: ['Quero marcar uma consulta de odontologia', 'Quanto custa a dermatologia?', 'Vocês aceitam Unimed?', 'Qual o horário de sábado?', 'Pode ser o primeiro horário'],
  en: ['I want to book a dental appointment', 'How much is dermatology?', 'Do you accept Unimed?', 'What are Saturday hours?', 'The first slot works'],
  es: ['Quiero agendar odontología', '¿Cuánto cuesta dermatología?', '¿Aceptan Unimed?', '¿Cuál es el horario del sábado?', 'El primer horario sirve'],
  fr: ['Je veux réserver en dentisterie', 'Combien coûte la dermatologie ?', 'Acceptez-vous Unimed ?', 'Quels sont les horaires du samedi ?', 'Le premier créneau me va']
};

function filteredChats() {
  return state.chats.filter(c => {
    if (filter === 'ai' && c.mode !== 'ai') return false;
    if (filter === 'human' && c.mode !== 'human') return false;
    if (filter === 'needs' && c.status !== 'needs') return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.messages.some(m => m.text.toLowerCase().includes(q));
    }
    return true;
  });
}

function listHTML() {
  const chats = filteredChats();
  if (!chats.length) return emptyState('message', t('c.empty'));
  return chats.map(c => {
    const last = c.messages[c.messages.length - 1];
    return `<div class="wa-item ${c.id === activeId ? 'active' : ''}" data-chat="${c.id}">
      <span class="wa-avatar-wrap">${avatar(c.name, 42)}
        <span class="wa-mode-dot ${c.mode === 'ai' ? 'wa-mode-ai' : 'wa-mode-human'}">${c.mode === 'ai' ? '✦' : 'H'}</span>
      </span>
      <div class="wa-item-body">
        <div class="wa-item-top"><b>${esc(c.name)}</b><time>${last ? fmtTime(new Date(last.ts)) : ''}</time></div>
        <div class="wa-item-msg">${last?.sender === 'sophia' ? '✦ ' : ''}${esc(last ? (last.sender === 'sophia' ? sophiaMessageText(last) : loc(last.text)) : '')}</div>
        <div class="wa-item-tags">
          ${c.status === 'needs' ? badge(t('nav.needs'), 'gold', 'alert') : c.mode === 'ai' ? badge(t('wa.filter.ai'), 'green', 'sparkles') : badge(t('wa.filter.human'), 'dark', 'user')}
          ${c.unread ? `<span class="wa-unread">${c.unread}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function msgHTML(m) {
  if (m.sender === 'system') return `<div class="msg msg-system msg-in"><div class="msg-bubble">${esc(sophiaMessageText(m))}</div></div>`;
  const cls = m.sender === 'user' ? 'msg-user' : m.sender === 'sophia' ? 'msg-sophia' : 'msg-human';
  const sender = m.sender === 'sophia' ? `<div class="msg-sender">${icon('sparkles', 11)} SOPHIA AI</div>`
    : m.sender === 'human' ? `<div class="msg-sender">${icon('user', 11)} ${t('wa.sentByHuman').toUpperCase()}</div>` : '';
  const body = m.sender === 'sophia' ? sophiaMessageText(m) : loc(m.text);
  const booking = m.kind === 'booking' && m.data ? `<div class="msg-booking"><b>${icon('calendar', 12)} ${t('wa.booked')}</b>${esc(loc(m.data.type))} · ${esc(m.data.doctor)}<br>${m.data.date ? esc(m.data.date) + ' · ' : ''}${esc(m.data.time)} · ${money(m.data.value)}</div>` : '';
  return `<div class="msg ${cls} msg-in"><div class="msg-bubble">${sender}${esc(body)}${booking}<span class="msg-time">${fmtTime(new Date(m.ts))}${m.sender !== 'user' ? ' ✓✓' : ''}</span></div></div>`;
}

function chatHTML() {
  const c = getChat(activeId);
  if (!c) return emptyState('messageCircle', t('wa.noChat'));
  const slots = chatSlots[c.id];
  return `
    <div class="wa-chat-head">
      <button class="icon-btn wa-back" id="wa-back">${icon('chevronLeft', 18)}</button>
      ${avatar(c.name, 38)}
      <div class="wa-chat-head-info">
        <b>${esc(c.name)} ${c.mode === 'ai' ? badge(t('wa.aiPilot'), 'green', 'sparkles') : badge(t('wa.humanMode'), 'gold', 'user')}</b>
        <small>${esc(c.phone)} · ${esc(loc(c.intent || '—'))}</small>
      </div>
      <button class="btn ${c.mode === 'ai' ? 'btn-outline' : 'btn-soft'} btn-sm" id="wa-takeover">
        ${icon(c.mode === 'ai' ? 'userCheck' : 'bot', 14)}<span>${c.mode === 'ai' ? t('wa.takeOver') : t('wa.returnAi')}</span>
      </button>
    </div>
    <div class="wa-messages" id="wa-messages">
      ${c.messages.map(msgHTML).join('')}
      ${typingChats.has(c.id) ? typingHTML() : ''}
      ${slots?.length ? `<div class="wa-slots">${slots.map((s, i) => `<button class="slot-chip" data-slot="${i}" style="animation-delay:${i * 80}ms">📅 ${esc(s.label)}</button>`).join('')}</div>` : ''}
    </div>
    <div class="wa-quick" id="wa-quick">
      ${contextualQuickReplies(c).map(q => `<button class="quick-chip" data-quick="${q.id}">${icon('zap', 11)} ${esc(loc(q.text).slice(0, 42))}…</button>`).join('')}
    </div>
    <form class="wa-composer" id="wa-form">
      <select class="select" id="wa-sendas" style="width:auto;flex-shrink:0" title="">
        <option value="client" ${sendAs === 'client' ? 'selected' : ''}>👤 ${t('wa.simulate')}</option>
        <option value="human" ${sendAs === 'human' ? 'selected' : ''}>🧑‍⚕️ ${t('wa.filter.human')}</option>
      </select>
      <input class="input flex-1" id="wa-input" placeholder="${sendAs === 'client' ? t('wa.placeholderAi') : t('wa.placeholder')}" autocomplete="off">
      <button type="submit" class="wa-send" aria-label="${t('c.send')}">${icon('send', 18)}</button>
    </form>`;
}

function typingHTML() {
  return `<div class="typing-bubble msg-in">${icon('sparkles', 13)} ${t('wa.typing')} <span class="typing-dots"><span></span><span></span><span></span></span></div>`;
}

function contextualQuickReplies(c) {
  const lastUser = [...c.messages].reverse().find(m => m.sender === 'user');
  const text = lastUser?.text || '';
  const scored = state.quickReplies.map(q => {
    const triggers = q.trigger.split('|');
    const hit = triggers.some(tr => text.toLowerCase().includes(tr.trim()));
    return { ...q, hit };
  });
  return [...scored.filter(q => q.hit), ...scored.filter(q => !q.hit)].slice(0, 4);
}

function infoHTML() {
  const c = getChat(activeId);
  if (!c) return '<div class="wa-info"></div>';
  const stageOpts = ['lead', 'qualified', 'scheduled', 'confirmed', 'done', 'lost'];
  const bookings = c.messages.filter(m => m.kind === 'booking');
  const escalations = c.messages.filter(m => m.sender === 'system');
  return `
    <div class="wa-info-head">
      ${avatar(c.name, 62)}
      <b>${esc(c.name)}</b><small>${esc(c.phone)}</small>
      <div class="info-tags mt-2" style="justify-content:center">${locList(c.tags).map(tag => badge(tag, 'gray')).join('')}</div>
    </div>
    <div class="info-block">
      <h5>${t('wa.intent')}</h5>
      <p>${icon('target', 13)} ${esc(loc(c.intent || '—'))}</p>
    </div>
    <div class="info-block">
      <h5>${t('wa.stage')}</h5>
      <select class="select" id="wa-stage">
        ${stageOpts.map(s => `<option value="${s}" ${c.stage === s ? 'selected' : ''}>${t('funnel.' + s)}</option>`).join('')}
      </select>
    </div>
    <div class="info-block">
      <h5>${t('wa.aiActions')}</h5>
      ${bookings.map(b => `<div class="ai-action">${icon('calendar', 13)}<span>${t('wa.booked')}: ${esc(loc(b.data.type))} ${esc(b.data.time)}</span></div>`).join('')}
      ${escalations.map(() => `<div class="ai-action">${icon('alert', 13)}<span>${t('wa.escalated')}</span></div>`).join('')}
      <div class="ai-action">${icon('zap', 13)}<span>${t('ev.replied', { name: c.name.split(' ')[0], s: 8 })}</span></div>
    </div>
    <button class="btn btn-outline btn-sm w-full" id="wa-resolve">${icon('checkCircle', 14)} ${t('wa.resolve')}</button>
    <button class="btn btn-soft btn-sm w-full" id="wa-goto-schedule">${icon('calendar', 14)} ${t('nav.schedule')}</button>`;
}

/* ---------------- Ações ---------------- */
function scrollBottom() {
  const box = $('#wa-messages');
  if (box) box.scrollTop = box.scrollHeight;
}

function renderChatPane() {
  const pane = $('.wa-chat');
  if (!pane) return;
  pane.outerHTML = `<div class="wa-chat">${chatHTML()}</div>`;
  wireChat();
  scrollBottom();
}
function renderInfoPane() {
  const pane = $('.wa-info');
  if (pane) { pane.outerHTML = `<div class="wa-info">${infoHTML()}</div>`; wireInfo(); }
}
function renderList() {
  const box = $('#wa-items');
  if (box) { box.innerHTML = listHTML(); wireList(); }
}

function sendClientMessage(text) {
  const c = getChat(activeId);
  if (!c || !text.trim()) return;
  chatSlots[c.id] = null;
  addMessage(c.id, { sender: 'user', text });
  if (c.mode === 'ai' && state.autopilot) {
    typingChats.add(c.id);
    renderChatPane();
    setTimeout(() => {
      const res = sophiaRespond(c, text);
      typingChats.delete(c.id);
      addMessage(c.id, { sender: 'sophia', text: res.text, ssrc: res.ssrc, skey: res.skey, sparams: res.sparams, kind: res.booking ? 'booking' : undefined, data: res.booking });
      if (res.slots) chatSlots[c.id] = res.slots;
      if (res.booking) toast(t('wa.bookedToast', { type: res.booking.type, name: c.name, time: res.booking.time }), 'success');
      if (res.actions.includes('escalate')) { toast(t('wa.escalated'), 'warn'); playAlert(); }
      renderChatPane(); renderInfoPane(); renderList();
    }, 1200 + Math.random() * 900);
  } else {
    renderChatPane(); renderList();
  }
}

function sendHumanMessage(text) {
  const c = getChat(activeId);
  if (!c || !text.trim()) return;
  if (c.mode !== 'human') { setChatMode(c.id, 'human'); }
  addMessage(c.id, { sender: 'human', text });
  renderChatPane(); renderInfoPane(); renderList();
}

function wireList() {
  $$('#wa-items [data-chat]').forEach(n => n.addEventListener('click', () => {
    activeId = n.dataset.chat;
    const c = getChat(activeId);
    if (c) { c.unread = 0; commit('chats', { chatId: activeId }); }
    $('.wa-layout')?.classList.add('chat-open');
    renderList(); renderChatPane(); renderInfoPane();
  }));
}

function wireChat() {
  const c = getChat(activeId);
  if (!c) return;
  $('#wa-back')?.addEventListener('click', () => $('.wa-layout')?.classList.remove('chat-open'));
  $('#wa-takeover')?.addEventListener('click', () => {
    const next = c.mode === 'ai' ? 'human' : 'ai';
    setChatMode(c.id, next);
    addMessage(c.id, { sender: 'system', text: next === 'human' ? t('wa.tookOver', { name: c.name }) : t('wa.returned', { name: c.name }), ssrc: 'T', skey: next === 'human' ? 'wa.tookOver' : 'wa.returned', sparams: { name: c.name } });
    if (next === 'human') { playTakeover(); sendAs = 'human'; }
    else { playBack(); sendAs = 'client'; }
    toast(next === 'human' ? t('wa.tookOver', { name: c.name }) : t('wa.returned', { name: c.name }), next === 'human' ? 'info' : 'success');
    renderChatPane(); renderInfoPane(); renderList();
    if (next === 'human') { setTimeout(() => $('#wa-input')?.focus(), 60); }
    else {
      /* Sophia retoma o atendimento imediatamente */
      typingChats.add(c.id); renderChatPane();
      setTimeout(() => {
        typingChats.delete(c.id);
        addMessage(c.id, { sender: 'sophia', text: t('sophia.resume'), ssrc: 'T', skey: 'sophia.resume' });
        renderChatPane(); renderList();
      }, 650);
    }
  });
  $('#wa-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#wa-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    if (sendAs === 'client') sendClientMessage(text);
    else sendHumanMessage(text);
  });
  $('#wa-sendas')?.addEventListener('change', e => {
    sendAs = e.target.value;
    $('#wa-input').placeholder = sendAs === 'client' ? t('wa.placeholderAi') : t('wa.placeholder');
  });
  $$('.slot-chip').forEach(b => b.addEventListener('click', () => {
    const s = chatSlots[c.id]?.[Number(b.dataset.slot)];
    if (s) { sendAs = 'client'; sendClientMessage(s.label); }
  }));
  $$('.quick-chip').forEach(b => b.addEventListener('click', () => {
    const q = state.quickReplies.find(x => x.id === b.dataset.quick);
    if (q) { sendAs = 'human'; sendHumanMessage(loc(q.text)); }
  }));
}

function wireInfo() {
  $('#wa-stage')?.addEventListener('change', e => {
    const c = getChat(activeId);
    const lead = state.funnel.flatMap(col => col.items).find(i => i.chatId === c.id);
    if (lead) { moveLead(lead.id, e.target.value); toast(t('funnel.moved', { name: lead.name, stage: t('funnel.' + e.target.value) }), 'success'); }
    c.stage = e.target.value; commit('chats');
  });
  $('#wa-resolve')?.addEventListener('click', () => {
    const c = getChat(activeId);
    c.status = 'resolved'; c.unread = 0;
    state.queue = state.queue.filter(q => q.chatId !== c.id);
    state.issues = state.issues.filter(i => i.chatId !== c.id);
    commit('chats'); commit('issues');
    toast(t('wa.resolved'), 'success');
    renderList(); renderChatPane();
  });
  $('#wa-goto-schedule')?.addEventListener('click', () => navigate('schedule'));
}

export default {
  render(params) {
    if (params.chatId && getChat(params.chatId)) activeId = params.chatId;
    if (!activeId || !getChat(activeId)) activeId = state.chats[0]?.id;
    const c = getChat(activeId);
    if (c) c.unread = 0;
    sendAs = c?.mode === 'human' ? 'human' : 'client';
    return `
      ${sectionHead(t('wa.title'), t('wa.sub'), `<button class="btn btn-primary" id="wa-simulate">${icon('whatsapp', 16)} ${t('wa.simulate')}</button>`)}
      <div class="wa-layout ${params.chatId ? 'chat-open' : ''}">
        <div class="wa-list">
          <div class="wa-list-head">
            <div class="input-icon">${icon('search', 15)}<input class="input" id="wa-search" placeholder="${t('wa.searchPh')}" value="${esc(search)}"></div>
            <div class="wa-filters">
              ${['all', 'ai', 'human', 'needs'].map(f => `<button class="chip chip-sm ${filter === f ? 'active' : ''}" data-filter="${f}">${t('wa.filter.' + f)}</button>`).join('')}
            </div>
          </div>
          <div class="wa-items" id="wa-items">${listHTML()}</div>
        </div>
        <div class="wa-chat">${chatHTML()}</div>
        <div class="wa-info">${infoHTML()}</div>
      </div>`;
  },
  mount(root) {
    wireList(); wireChat(); wireInfo();
    $('#wa-search')?.addEventListener('input', debounce(e => { search = e.target.value; renderList(); }, 200));
    $$('[data-filter]', root).forEach(b => b.addEventListener('click', () => {
      filter = b.dataset.filter;
      $$('[data-filter]', root).forEach(x => x.classList.toggle('active', x === b));
      renderList();
    }));
    $('#wa-simulate')?.addEventListener('click', () => {
      const msgs = SIM_CLIENT[getLang()] || SIM_CLIENT.pt;
      sendAs = 'client';
      const sel = $('#wa-sendas'); if (sel) sel.value = 'client';
      sendClientMessage(msgs[Math.floor(Math.random() * msgs.length)]);
      $('.wa-layout')?.classList.add('chat-open');
    });
    scrollBottom();

    /* Atualizações ao vivo (simulação em background) */
    const offChats = bus.on('chats', ({ chatId } = {}) => {
      renderList();
      if (chatId === activeId && !typingChats.has(activeId)) { renderChatPane(); renderInfoPane(); }
    });
    const offTyping = bus.on('typing', ({ chatId, on }) => {
      if (on) typingChats.add(chatId); else typingChats.delete(chatId);
      if (chatId === activeId) renderChatPane();
    });
    return () => { offChats(); offTyping(); typingChats.clear(); };
  }
};
