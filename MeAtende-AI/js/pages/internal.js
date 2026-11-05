/* =====================================================================
   MeAtende AI — pages/internal.js
   Agente Interno: pergunte como perguntaria a um gerente.
   ===================================================================== */
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { $, $$, esc, fmtTime } from '../utils.js';
import { state, commit } from '../store.js';
import { sectionHead, badge } from '../ui.js';
import { internalAgentAnswer } from '../sophia.js';

let messages = [];

function msgHTML(m, i) {
  const cls = m.sender === 'manager' ? 'imsg-manager' : 'imsg-ai';
  const av = m.sender === 'manager'
    ? `<span class="imsg-avatar" style="background:var(--gray-100);color:var(--gray-600)">${icon('user', 16)}</span>`
    : `<span class="imsg-avatar">${icon('cpu', 17)}</span>`;
  return `<div class="imsg ${cls} msg-in" style="animation-delay:${Math.min(i * 40, 200)}ms">${av}
    <div class="imsg-bubble">${esc(m.text)}<span class="msg-time" style="color:${m.sender === 'manager' ? 'rgba(255,255,255,.5)' : 'var(--gray-400)'}">${fmtTime(new Date(m.ts))}</span></div>
  </div>`;
}

function thinkingHTML() {
  return `<div class="imsg imsg-ai msg-in" id="int-thinking"><span class="imsg-avatar">${icon('cpu', 17)}</span>
    <div class="imsg-bubble" style="display:flex;align-items:center;gap:9px;color:var(--green-700);font-weight:700;font-size:12px">
      ${t('int.thinking')} <span class="typing-dots"><span></span><span></span><span></span></span>
    </div></div>`;
}

export default {
  render() {
    if (!messages.length) messages = [{ sender: 'ai', text: t('int.greeting'), ts: Date.now() }];
    return `
      ${sectionHead(t('int.title'), t('int.sub'), badge('GPT Manager', 'gold', 'cpu'))}
      <div class="internal-wrap">
        <div class="card internal-chat">
          <div class="internal-hero">
            <span class="internal-hero-ic float">${icon('cpu', 24)}</span>
            <div class="flex-1"><b>${t('int.title')} — MeAtende AI</b><small>${t('int.sub')}</small></div>
            <span class="pulse-live">${t('c.online')}</span>
          </div>
          <div class="internal-msgs" id="int-msgs">${messages.map(msgHTML).join('')}</div>
          <div class="internal-suggest">
            ${['int.q1', 'int.q2', 'int.q3', 'int.q4', 'int.q5', 'int.q6'].map(k => `<button class="chip chip-sm" data-q="${k}">${icon('sparkles', 11)} ${t(k)}</button>`).join('')}
          </div>
          <form class="internal-composer" id="int-form">
            <input class="input flex-1" id="int-input" placeholder="${t('int.placeholder')}" autocomplete="off">
            <button type="submit" class="wa-send">${icon('send', 18)}</button>
          </form>
        </div>
      </div>`;
  },
  mount(root) {
    const box = $('#int-msgs');
    const scroll = () => { box.scrollTop = box.scrollHeight; };
    scroll();
    const ask = text => {
      if (!text.trim()) return;
      messages.push({ sender: 'manager', text, ts: Date.now() });
      box.insertAdjacentHTML('beforeend', msgHTML(messages[messages.length - 1], 0));
      box.insertAdjacentHTML('beforeend', thinkingHTML());
      scroll();
      setTimeout(() => {
        $('#int-thinking')?.remove();
        const answer = internalAgentAnswer(text);
        messages.push({ sender: 'ai', text: answer, ts: Date.now() });
        box.insertAdjacentHTML('beforeend', msgHTML(messages[messages.length - 1], 0));
        scroll();
      }, 1100 + Math.random() * 800);
    };
    $('#int-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const input = $('#int-input');
      ask(input.value); input.value = '';
    });
    $$('[data-q]', root).forEach(b => b.onclick = () => ask(t(b.dataset.q)));
  }
};
