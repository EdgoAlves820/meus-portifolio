/* =====================================================================
   MeAtende AI — ui.js
   Toasts, modais, dropdowns e helpers visuais compartilhados.
   ===================================================================== */
import { el, esc, $ } from './utils.js';
import { icon } from './icons.js';
import { t } from './i18n.js';

/* ---------------- Toasts ---------------- */
let toastWrap = null;
export function toast(message, type = 'success', ms = 3600) {
  if (!toastWrap) {
    toastWrap = el('<div class="toast-wrap" aria-live="polite"></div>');
    document.body.appendChild(toastWrap);
  }
  const icons = { success: 'checkCircle', info: 'info', warn: 'alert', error: 'xCircle' };
  const node = el(`
    <div class="toast toast-${type}">
      <span class="toast-ic">${icon(icons[type] || 'info', 18)}</span>
      <span class="toast-msg">${esc(message)}</span>
      <button class="toast-x" aria-label="${t('c.close')}">${icon('x', 14)}</button>
    </div>`);
  node.querySelector('.toast-x').onclick = () => dismiss();
  toastWrap.appendChild(node);
  requestAnimationFrame(() => node.classList.add('show'));
  const timer = setTimeout(dismiss, ms);
  function dismiss() {
    clearTimeout(timer);
    node.classList.remove('show');
    node.classList.add('hide');
    setTimeout(() => node.remove(), 300);
  }
}

/* ---------------- Modal ---------------- */
let modalRoot = null;
export function openModal({ title, subtitle = '', body, footer = '', size = 'md', onMount, onClose }) {
  closeModal();
  modalRoot = el(`
    <div class="modal-overlay" role="dialog" aria-modal="true">
      <div class="modal modal-${size}">
        <div class="modal-head">
          <div>
            <h3>${esc(title)}</h3>
            ${subtitle ? `<p class="modal-sub">${esc(subtitle)}</p>` : ''}
          </div>
          <button class="icon-btn modal-close" aria-label="${t('c.close')}">${icon('x', 18)}</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
      </div>
    </div>`);
  document.body.appendChild(modalRoot);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => modalRoot.classList.add('show'));
  modalRoot.querySelector('.modal-close').onclick = () => { closeModal(); onClose?.(); };
  modalRoot.addEventListener('mousedown', e => { if (e.target === modalRoot) { closeModal(); onClose?.(); } });
  const escHandler = e => { if (e.key === 'Escape') { closeModal(); onClose?.(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
  onMount?.(modalRoot);
  return modalRoot;
}
export function closeModal() {
  if (!modalRoot) return;
  const m = modalRoot; modalRoot = null;
  m.classList.remove('show');
  document.body.classList.remove('modal-open');
  setTimeout(() => m.remove(), 220);
}

export function confirmModal({ title, message, confirmLabel, danger = false, onConfirm }) {
  const m = openModal({
    title, size: 'sm',
    body: `<p class="confirm-msg">${esc(message)}</p>`,
    footer: `
      <button class="btn btn-ghost" data-act="cancel">${t('c.cancel')}</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${esc(confirmLabel || t('c.confirm'))}</button>`
  });
  m.querySelector('[data-act="cancel"]').onclick = closeModal;
  m.querySelector('[data-act="ok"]').onclick = () => { closeModal(); onConfirm?.(); };
}

/* ---------------- Badges & blocos ---------------- */
export function badge(text, tone = 'green', ic = '') {
  return `<span class="badge badge-${tone}">${ic ? icon(ic, 12) : ''}${esc(text)}</span>`;
}

export function statusBadge(status) {
  const map = {
    confirmed: ['green', 'checkCircle'], pending: ['gold', 'clock'],
    done: ['dark', 'check'], cancelled: ['red', 'xCircle']
  };
  const [tone, ic] = map[status] || ['gray', 'info'];
  return badge(t(`sched.status.${status}`), tone, ic);
}

export function emptyState(ic, title, sub = '') {
  return `<div class="empty-state">
    <div class="empty-ic">${icon(ic, 34)}</div>
    <h4>${esc(title)}</h4>${sub ? `<p>${esc(sub)}</p>` : ''}
  </div>`;
}

export function sectionHead(title, sub = '', right = '') {
  return `<div class="section-head">
    <div><h2 class="page-title">${esc(title)}</h2>${sub ? `<p class="page-sub">${esc(sub)}</p>` : ''}</div>
    ${right ? `<div class="section-actions">${right}</div>` : ''}
  </div>`;
}

export function toggleSwitch(id, checked, label = '') {
  return `<label class="switch" title="${esc(label)}">
    <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
    <span class="switch-track"><span class="switch-thumb"></span></span>
  </label>`;
}

export function kpiCard({ label, value, sub, ic, tone = 'green', delta = '', countTo = null, money = false, suffix = '' }) {
  const valHtml = countTo !== null
    ? `<span data-count="${countTo}" ${money ? 'data-money="1"' : ''} data-suffix="${suffix}">0</span>`
    : esc(value);
  return `<div class="card kpi kpi-${tone}">
    <div class="kpi-top">
      <span class="kpi-ic">${icon(ic, 20)}</span>
      ${delta ? `<span class="kpi-delta ${delta.startsWith('-') ? 'down' : ''}">${icon(delta.startsWith('-') ? 'trendDown' : 'trendUp', 13)} ${esc(delta)}</span>` : ''}
    </div>
    <div class="kpi-val">${valHtml}</div>
    <div class="kpi-label">${esc(label)}</div>
    ${sub ? `<div class="kpi-sub">${esc(sub)}</div>` : ''}
  </div>`;
}
