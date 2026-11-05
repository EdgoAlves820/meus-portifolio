/* =====================================================================
   MeAtende AI — app.js
   Shell (sidebar + topbar), roteador hash, notificações, idiomas,
   ticker de SLA (15 min) e motor de simulação ao vivo.
   ===================================================================== */
import { t, getLang, setLang, LANGS } from './i18n.js';
import { tt } from './content.js';
import { icon, logoSVG } from './icons.js';
import { $, $$, esc, bus, avatar, ripple, animateCounters, relTime, debounce, uid } from './utils.js';
import { state, commit, save, markAllRead, markRead, clearNotifications, addNotification, addActivity, addMessage, addLead, getChat, SLA_SECONDS, HOURS, isOpenNow, todayAppointments } from './store.js';
import { toast, openModal, closeModal } from './ui.js';
import { sophiaReplyToChat } from './sophia.js';
import { playAlert, unlockAudio, setSoundEnabled, isSoundEnabled, playTakeover } from './sound.js';

import dashboard from './pages/dashboard.js';
import whatsapp from './pages/whatsapp.js';
import queue from './pages/queue.js';
import needs from './pages/needs.js';
import schedule from './pages/schedule.js';
import funnel from './pages/funnel.js';
import reports from './pages/reports.js';
import internal from './pages/internal.js';
import aiAgent from './pages/aiAgent.js';
import settings from './pages/settings.js';
import integrations from './pages/integrations.js';

const PAGES = { dashboard, whatsapp, queue, needs, schedule, funnel, reports, internal, ai: aiAgent, settings, integrations };

const NAV = [
  { group: 'nav.group.operate', items: [
    { id: 'dashboard', ic: 'dashboard' }, { id: 'whatsapp', ic: 'whatsapp' },
    { id: 'queue', ic: 'clock' }, { id: 'needs', ic: 'alert' }, { id: 'schedule', ic: 'calendar' }
  ]},
  { group: 'nav.group.growth', items: [
    { id: 'funnel', ic: 'kanban' }, { id: 'reports', ic: 'chart' }
  ]},
  { group: 'nav.group.config', items: [
    { id: 'internal', ic: 'cpu' }, { id: 'ai', ic: 'bot' },
    { id: 'settings', ic: 'sliders' }, { id: 'integrations', ic: 'plug' }
  ]}
];
const NAV_KEY = { dashboard: 'nav.dashboard', whatsapp: 'nav.whatsapp', queue: 'nav.queue', needs: 'nav.needs', schedule: 'nav.schedule', funnel: 'nav.funnel', reports: 'nav.reports', internal: 'nav.internal', ai: 'nav.ai', settings: 'nav.settings', integrations: 'nav.integrations' };

let currentPage = 'dashboard';
let currentParams = {};
let pageCleanup = null;
let notifOpen = false, langOpen = false, roleOpen = false;

/* ============================ ROTER ============================ */
export function navigate(page, params = {}) {
  const q = params.chatId ? `?chatId=${encodeURIComponent(params.chatId)}` : '';
  const hash = `#/${page}${q}`;
  if (location.hash === hash) route();
  else location.hash = hash;
}

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '') || 'dashboard';
  const [page, qs] = h.split('?');
  const params = {};
  if (qs) new URLSearchParams(qs).forEach((v, k) => params[k] = v);
  return { page: PAGES[page] ? page : 'dashboard', params };
}

function route() {
  const { page, params } = parseHash();
  if (pageCleanup) { try { pageCleanup(); } catch {} pageCleanup = null; }
  currentPage = page; currentParams = params;
  const main = $('#main');
  main.classList.remove('page-enter');
  main.innerHTML = PAGES[page].render(params);
  main.classList.add('page-enter');
  pageCleanup = PAGES[page].mount?.($('#main'), params) || null;
  animateCounters(main);
  updateNav();
  closeSidebar();
  window.scrollTo({ top: 0 });
  main.scrollTop = 0;
}
export function refresh() { route(); }

/* ============================ SHELL ============================ */
function navBadge(id) {
  if (id === 'queue') return { text: String(state.queue.length), tone: 'green' };
  if (id === 'needs' && state.issues.length) return { text: String(state.issues.length), tone: 'gold' };
  if (id === 'schedule') return { text: String(todayAppointments().length), tone: 'soft' };
  if (id === 'whatsapp') {
    const un = state.chats.reduce((s, c) => s + (c.unread || 0), 0);
    return un ? { text: String(un), tone: 'green' } : { text: 'IA', tone: 'soft' };
  }
  if (id === 'internal') return { text: t('c.newBadge'), tone: 'gold' };
  return null;
}

function renderSidebar() {
  const sb = $('#sidebar');
  sb.innerHTML = `
    <div class="brand" data-nav="dashboard">
      <span class="brand-logo">${logoSVG(40)}</span>
      <span class="brand-text">MeAtende <b>AI</b><small>${t('app.tagline')}</small></span>
      <span class="brand-plan">${t('app.plan')}</span>
    </div>
    <nav class="nav">
      ${NAV.map(g => `
        <div class="nav-group">${t(g.group)}</div>
        ${g.items.map(it => {
          const b = navBadge(it.id);
          return `<button class="nav-item ${currentPage === it.id ? 'active' : ''}" data-nav="${it.id}">
            ${icon(it.ic, 19)}<span class="nav-label">${t(NAV_KEY[it.id])}</span>
            ${b ? `<span class="nav-badge nav-badge-${b.tone}" data-badge="${it.id}">${b.text}</span>` : ''}
          </button>`;
        }).join('')}`).join('')}
    </nav>
    <div class="sidebar-foot">
      <div class="hours-card">
        <div class="hours-title">${icon('calendarDays', 15)} ${t('hours.title')}</div>
        <div class="hours-row"><span>${t('hours.weekdays')}</span><b>07:00–16:30</b></div>
        <div class="hours-row"><span>${t('hours.sat')}</span><b>08:00–13:00</b></div>
        <div class="hours-row closed"><span>${t('hours.sun')}</span><b>${t('hours.closed')}</b></div>
        <div class="hours-ai">${icon('sparkles', 12)} ${t('hours.ai247')}</div>
      </div>
      <div class="sophia-mini ${state.autopilot ? '' : 'off'}">
        <span class="sophia-dot"></span>
        <div><b>Sophia</b><small>${state.autopilot ? t('top.autopilotOn') : t('top.autopilotOff')}</small></div>
        ${icon('bot', 18)}
      </div>
    </div>`;
  $$('.nav-item, .brand', sb).forEach(n => n.addEventListener('click', () => navigate(n.dataset.nav)));
}

function renderTopbar() {
  const tb = $('#topbar');
  const unread = state.notifications.filter(n => n.unread).length;
  const lang = LANGS.find(l => l.code === getLang());
  tb.innerHTML = `
    <div class="tb-left">
      <button class="icon-btn only-mobile" id="btn-menu" aria-label="${t('nav.menu')}">${icon('menu', 21)}</button>
      <button class="search-pill" id="btn-search">${icon('search', 16)}<span>${t('nav.search')}</span><kbd>Ctrl K</kbd></button>
    </div>
    <div class="tb-right">
      <button class="autopilot-pill ${state.autopilot ? 'on' : ''}" id="btn-autopilot">
        <span class="ap-dot"></span><span class="ap-label">${state.autopilot ? t('top.autopilotOn') : t('top.autopilotOff')}</span>
        ${icon(state.autopilot ? 'pause' : 'play', 13)}
      </button>
      <button class="icon-btn" id="btn-sound" aria-label="${t('sound.toggle')}" title="${t('sound.toggle')}">${icon(isSoundEnabled() ? 'volume' : 'volumeX', 18)}</button>
      <button class="icon-btn" id="btn-theme" aria-label="${t('theme.toggle')}" title="${getTheme() === 'dark' ? t('theme.light') : t('theme.dark')}">${icon(getTheme() === 'dark' ? 'sun' : 'moon', 18)}</button>
      <div class="dd-wrap">
        <button class="icon-btn lang-btn" id="btn-lang">${icon('globe', 17)}<b>${lang.short}</b>${icon('chevronDown', 12)}</button>
        <div class="dropdown lang-dd ${langOpen ? 'open' : ''}" id="lang-dd">
          ${LANGS.map(l => `<button class="dd-item ${l.code === getLang() ? 'sel' : ''}" data-lang="${l.code}">
            <span class="flag">${l.flag}</span><span>${l.label}</span>${l.code === getLang() ? icon('check', 15) : ''}
          </button>`).join('')}
        </div>
      </div>
      <div class="dd-wrap">
        <button class="icon-btn bell-btn ${unread ? 'has-unread' : ''}" id="btn-bell" aria-label="${t('notif.title')}">
          ${icon('bell', 19)}<span class="bell-count ${unread ? '' : 'hide'}" id="bell-count">${unread}</span>
        </button>
        <div class="dropdown notif-dd ${notifOpen ? 'open' : ''}" id="notif-dd">${notifListHTML()}</div>
      </div>
      <div class="dd-wrap">
        <button class="tb-user" id="btn-role" title="${t('role.switch')}">
          ${avatar('Clínica Vida Plena', 36)}
          <div class="tb-user-info"><b>${esc(state.settings.profile.name)}</b><small>${t('role.' + (state.settings.profile.role || 'gestor'))}</small></div>
          ${icon('chevronDown', 13)}
        </button>
        <div class="dropdown role-dd ${roleOpen ? 'open' : ''}" id="role-dd">
          <div class="role-dd-head">${icon('userCheck', 14)} ${t('role.switch')}</div>
          ${['gestor', 'socio', 'gerente', 'diretor'].map(r => `<button class="dd-item ${(state.settings.profile.role || 'gestor') === r ? 'sel' : ''}" data-role="${r}">
            ${icon('user', 15)}<span>${t('role.' + r)}</span>${(state.settings.profile.role || 'gestor') === r ? icon('check', 15) : ''}
          </button>`).join('')}
        </div>
      </div>
    </div>`;

  $('#btn-menu').onclick = openSidebar;
  $('#btn-search').onclick = openPalette;
  $('#btn-theme').onclick = () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    renderTopbar();
    toast(getTheme() === 'dark' ? '🌙 ' + t('theme.dark') : '☀️ ' + t('theme.light'), 'info', 1800);
  };
  $('#btn-sound').onclick = () => {
    const next = !isSoundEnabled();
    setSoundEnabled(next);
    if (next) { unlockAudio(); playTakeover(); }
    renderTopbar();
    toast(next ? '🔊 ' + t('sound.on') : '🔇 ' + t('sound.off'), 'info', 1800);
  };
  $('#btn-autopilot').onclick = () => {
    state.autopilot = !state.autopilot;
    commit('autopilot');
    toast(state.autopilot ? t('top.activated') : t('top.paused'), state.autopilot ? 'success' : 'warn');
    renderTopbar(); renderSidebar(); updateNav();
  };
  $('#btn-lang').onclick = e => { e.stopPropagation(); langOpen = !langOpen; notifOpen = false; roleOpen = false; syncDropdowns(); };
  $('#btn-bell').onclick = e => { e.stopPropagation(); notifOpen = !notifOpen; langOpen = false; roleOpen = false; syncDropdowns(); };
  $('#btn-role').onclick = e => { e.stopPropagation(); roleOpen = !roleOpen; langOpen = false; notifOpen = false; syncDropdowns(); };
  $$('#lang-dd [data-lang]').forEach(b => b.onclick = () => {
    setLang(b.dataset.lang); langOpen = false;
    renderSidebar(); renderTopbar(); route();
    toast(`${LANGS.find(l => l.code === getLang()).flag} ${LANGS.find(l => l.code === getLang()).label}`, 'info', 2200);
  });
  $$('#role-dd [data-role]').forEach(b => b.onclick = () => {
    state.settings.profile.role = b.dataset.role;
    commit('settings'); roleOpen = false;
    renderTopbar();
    toast(t('role.switched', { role: t('role.' + b.dataset.role) }), 'success', 2200);
  });
  wireNotifDropdown();
}

function notifListHTML() {
  const unread = state.notifications.filter(n => n.unread).length;
  return `
    <div class="notif-head">
      <div class="notif-title">${icon('bell', 15)} ${t('notif.title')} ${unread ? `<span class="pill-mini">${unread} ${t('notif.unread')}</span>` : ''}</div>
      <div class="notif-actions">
        ${unread ? `<button class="link-btn" id="notif-markall">${icon('checkCheck', 14)} ${t('notif.markAll')}</button>` : ''}
        ${state.notifications.length ? `<button class="link-btn muted" id="notif-clear">${icon('trash', 13)} ${t('notif.clear')}</button>` : ''}
      </div>
    </div>
    <div class="notif-list">
      ${state.notifications.length ? state.notifications.map(n => {
        const rt = relTime(n.ts);
        return `<div class="notif-item ${n.unread ? 'unread' : ''}" data-notif="${n.id}">
          <span class="notif-ic ni-${n.icon || 'info'}">${icon(n.icon || 'info', 15)}</span>
          <div class="notif-body">
            <p>${esc(tt(n.key, n.params))}</p>
            <div class="notif-meta"><span>${t(rt.key, rt.params)}</span><span class="notif-open">${t('notif.clickOpen')} ${icon('chevronRight', 11)}</span></div>
          </div>
          ${n.unread ? '<span class="unread-dot"></span>' : ''}
        </div>`;
      }).join('') : `<div class="notif-empty">${icon('checkCircle', 26)}<p>${t('notif.empty')}</p></div>`}
    </div>`;
}

function wireNotifDropdown() {
  const dd = $('#notif-dd');
  $('#notif-markall')?.addEventListener('click', e => { e.stopPropagation(); markAllRead(); toast(t('notif.allRead'), 'success'); });
  $('#notif-clear')?.addEventListener('click', e => { e.stopPropagation(); clearNotifications(); toast(t('notif.cleared'), 'info'); });
  $$('[data-notif]', dd).forEach(item => item.addEventListener('click', () => {
    const n = state.notifications.find(x => x.id === item.dataset.notif);
    if (!n) return;
    markRead(n.id);
    notifOpen = false; syncDropdowns();
    if (n.target?.page) navigate(n.target.page, n.target.chatId ? { chatId: n.target.chatId } : {});
  }));
}

function syncDropdowns() {
  $('#lang-dd')?.classList.toggle('open', langOpen);
  $('#notif-dd')?.classList.toggle('open', notifOpen);
  $('#role-dd')?.classList.toggle('open', roleOpen);
}
function updateNotifUI() {
  const unread = state.notifications.filter(n => n.unread).length;
  const cnt = $('#bell-count');
  if (cnt) { cnt.textContent = unread; cnt.classList.toggle('hide', !unread); }
  $('#btn-bell')?.classList.toggle('has-unread', !!unread);
  const dd = $('#notif-dd');
  if (dd) { dd.innerHTML = notifListHTML(); wireNotifDropdown(); }
}

function updateNav() {
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.nav === currentPage));
  ['queue', 'needs', 'schedule', 'whatsapp'].forEach(id => {
    const b = $(`[data-badge="${id}"]`);
    const data = navBadge(id);
    if (b && data) b.textContent = data.text;
  });
}

/* ============================ SIDEBAR MOBILE ============================ */
function openSidebar() { $('#sidebar').classList.add('open'); $('#scrim').classList.add('show'); }
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); }

/* ============================ COMMAND PALETTE ============================ */
function openPalette() {
  const items = Object.keys(PAGES).map(id => ({ id, label: t(NAV_KEY[id]), ic: NAV.flatMap(g => g.items).find(i => i.id === id)?.ic || 'info' }));
  const m = openModal({
    title: t('nav.menu'), size: 'sm',
    body: `<div class="palette">
      <div class="palette-input">${icon('search', 17)}<input id="palette-q" placeholder="${t('c.search')}…" autocomplete="off"></div>
      <div class="palette-list">${items.map(i => `<button class="palette-item" data-go="${i.id}">${icon(i.ic, 17)}<span>${i.label}</span>${icon('arrowRight', 14)}</button>`).join('')}</div>
    </div>`,
    onMount: root => {
      const input = root.querySelector('#palette-q');
      setTimeout(() => input.focus(), 60);
      const filter = () => {
        const q = input.value.toLowerCase();
        root.querySelectorAll('.palette-item').forEach(b => b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none');
      };
      input.addEventListener('input', filter);
      root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { closeModal(); navigate(b.dataset.go); });
    }
  });
}

/* ============================ SLA TICKER (15 min) ============================ */
function startSLATicker() {
  let persistCounter = 0;
  setInterval(() => {
    let changed = false;
    state.queue.forEach(q => {
      if (q.status === 'resolved') return;
      q.seconds -= 1; changed = true;
      if (q.seconds <= 0 && !q.alerted) {
        q.alerted = true;
        addNotification('ev.sla', { name: q.name, m: 15 }, 'clock', { page: 'queue', chatId: q.chatId });
        addActivity('ev.sla', { name: q.name, m: 15 }, 'clock');
      }
      if (q.seconds === 300 && !q.warned) {
        q.warned = true;
        addNotification('ev.sla', { name: q.name, m: 10 }, 'alert', { page: 'queue', chatId: q.chatId });
      }
    });
    if (changed) {
      bus.emit('sla');
      if (++persistCounter % 20 === 0) save();
    }
  }, 1000);
}

/* ============================ SIMULAÇÃO AO VIVO ============================ */
const SIM_POOL = [
  { name: 'Juliana Ramos', phone: '+55 79 98811-4455' },
  { name: 'Marcos Vinícius', phone: '+55 11 97722-8899' },
  { name: 'Patrícia Gomes', phone: '+55 21 96633-1122' },
  { name: 'Eduardo Nunes', phone: '+55 31 99544-7788' },
  { name: 'Aline Ferreira', phone: '+55 85 98123-6655' },
  { name: 'Thiago Barros', phone: '+55 41 99877-3344' }
];
const SIM_MSGS = {
  pt: ['Oi! Quanto custa a consulta com dermatologista?', 'Boa tarde! Quero marcar uma consulta de odontologia.', 'Vocês atendem pelo convênio Unimed?', 'Olá, quais os horários de atendimento?', 'Quero agendar nutrição para essa semana.', 'Oi, tenho dores no joelho, vocês têm ortopedia?'],
  en: ['Hi! How much is a dermatology appointment?', 'Good afternoon! I want to book a dental appointment.', 'Do you accept Unimed insurance?', 'Hello, what are your opening hours?', 'I want to book nutrition for this week.', 'Hi, my knee hurts, do you have orthopedics?'],
  es: ['¡Hola! ¿Cuánto cuesta la consulta de dermatología?', '¡Buenas tardes! Quiero agendar odontología.', '¿Atienden por el seguro Unimed?', 'Hola, ¿cuáles son los horarios?', 'Quiero agendar nutrición esta semana.', 'Hola, me duele la rodilla, ¿tienen ortopedia?'],
  fr: ['Bonjour ! Combien coûte une consultation en dermatologie ?', 'Bon après-midi ! Je veux réserver en dentisterie.', 'Acceptez-vous la mutuelle Unimed ?', 'Bonjour, quels sont vos horaires ?', 'Je veux réserver en nutrition cette semaine.', 'Bonjour, j’ai mal au genou, vous avez l’orthopédie ?']
};

function liveEvent() {
  if (!state.autopilot || document.hidden) return;
  const roll = Math.random();
  const lang = getLang();
  if (roll < 0.5) {
    /* Mensagem nova em conversa existente ou novo cliente */
    let chat = state.chats.filter(c => c.mode === 'ai' && c.status === 'active');
    let target;
    if (chat.length && Math.random() < 0.55) {
      target = chat[Math.floor(Math.random() * chat.length)];
    } else if (state.chats.length < 12) {
      const p = SIM_POOL[Math.floor(Math.random() * SIM_POOL.length)];
      target = { id: 'c' + uid(), name: p.name, phone: p.phone, mode: 'ai', status: 'active', unread: 0, stage: 'lead', intent: '—', tags: [], messages: [] };
      state.chats.unshift(target);
      state.queue.push({ id: 'q' + uid(), chatId: target.id, name: p.name, type: 'Triagem', priority: 'medium', status: 'waiting', seconds: SLA_SECONDS, alerted: false });
    } else {
      target = chat[0];
    }
    if (!target) return;
    const msgs = SIM_MSGS[lang] || SIM_MSGS.pt;
    const text = msgs[Math.floor(Math.random() * msgs.length)];
    addMessage(target.id, { sender: 'user', text });
    state.counters.chatsToday += 1;
    bus.emit('typing', { chatId: target.id, on: true });
    sophiaReplyToChat(target.id, text, 1600 + Math.random() * 1400).then(res => {
      bus.emit('typing', { chatId: target.id, on: false });
      if (res && !res.actions.includes('escalate')) {
        addActivity('ev.replied', { name: target.name, s: Math.round(4 + Math.random() * 9) }, 'zap');
        const q = state.queue.find(q => q.chatId === target.id);
        if (q && q.status === 'waiting') q.status = 'in_service';
      } else if (res && res.actions.includes('escalate')) {
        playAlert();
      }
    });
  } else if (roll < 0.72) {
    /* Confirmação de consulta */
    if (state.funnelAuto === false) return;
    const col = state.funnel.find(c => c.id === 'scheduled');
    if (col?.items.length) {
      const lead = col.items[Math.floor(Math.random() * col.items.length)];
      import('./store.js').then(({ moveLead }) => {
        moveLead(lead.id, 'confirmed', true);
        addNotification('ev.confirmed', { name: lead.name }, 'checkCircle', { page: 'funnel' });
        addActivity('ev.confirmed', { name: lead.name }, 'checkCircle');
      });
    }
  } else if (roll < 0.88) {
    /* Pagamento recebido */
    if (state.funnelAuto === false) return;
    const col = state.funnel.find(c => c.id === 'confirmed');
    if (col?.items.length) {
      const lead = col.items[Math.floor(Math.random() * col.items.length)];
      import('./store.js').then(({ moveLead }) => {
        moveLead(lead.id, 'done', true);
        state.counters.revenueMonth += lead.value;
        addNotification('ev.payment', { value: { __m: lead.value }, name: lead.name }, 'dollar', { page: 'funnel' });
        addActivity('ev.payment', { value: { __m: lead.value }, name: lead.name }, 'dollar');
      });
    }
  } else {
    addActivity('ev.followup', { name: SIM_POOL[Math.floor(Math.random() * SIM_POOL.length)].name }, 'refresh');
  }
}
function startLiveSim() {
  const loop = () => { liveEvent(); setTimeout(loop, 26000 + Math.random() * 22000); };
  setTimeout(loop, 12000);
}

/* ============================ BOOT ============================ */
/* ---------------- Tema claro/escuro ---------------- */
function lsThemeGet() { try { return localStorage.getItem('meatende.theme'); } catch { return null; } }
function lsThemeSet(v) { try { localStorage.setItem('meatende.theme', v); } catch {} }
function getTheme() { return lsThemeGet() === 'dark' ? 'dark' : 'light'; }
function applyTheme() { document.documentElement.setAttribute('data-theme', getTheme()); }
function setTheme(v) { lsThemeSet(v); applyTheme(); }

function boot() {
  applyTheme();
  document.documentElement.lang = getLang() === 'pt' ? 'pt-BR' : getLang();
  renderSidebar();
  renderTopbar();
  route();
  startSLATicker();
  startLiveSim();

  window.addEventListener('hashchange', route);
  document.addEventListener('click', e => {
    unlockAudio();
    ripple(e);
    if (!e.target.closest('.dd-wrap')) { notifOpen = false; langOpen = false; roleOpen = false; syncDropdowns(); }
  });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  });
  $('#scrim').addEventListener('click', closeSidebar);

  bus.on('notifications', updateNotifUI);
  bus.on('issues', updateNav);
  bus.on('appointments', updateNav);
  bus.on('chats', updateNav);
  bus.on('funnel', updateNav);
  bus.on('reset', () => { renderSidebar(); renderTopbar(); route(); });
  bus.on('autopilot', () => { renderSidebar(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
