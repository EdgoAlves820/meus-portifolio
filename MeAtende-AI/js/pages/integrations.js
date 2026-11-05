/* =====================================================================
   MeAtende AI — pages/integrations.js
   WhatsApp (QR + Meta Cloud API), Google Agenda, pagamentos, CRM,
   webhooks — com modais funcionais e QR animado.
   ===================================================================== */
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { $, $$, esc, copyText, relTime } from '../utils.js';
import { state, commit, addNotification } from '../store.js';
import { toast, openModal, closeModal, badge, sectionHead } from '../ui.js';
import { qrSVG } from '../charts.js';

let qrTimer = null;

function statusBadgeItg(connected) {
  return badge(connected ? t('c.connected') : t('c.disconnected'), connected ? 'green' : 'gray', connected ? 'checkCircle' : 'xCircle');
}

function cardsHTML() {
  const I = state.integrations;
  const cards = [
    {
      id: 'qr', ic: 'whatsapp', color: '#0E9F6E', title: t('itg.qr'), desc: t('itg.qrDesc'),
      connected: I.qr.connected, meta: I.qr.connected ? I.qr.number : '',
      actions: I.qr.connected
        ? `<button class="btn btn-outline btn-sm" data-itg="qr-open">${icon('qr', 14)} ${t('itg.scanTitle')}</button>
           <button class="btn btn-ghost btn-sm" data-itg="qr-disc">${t('c.disconnect')}</button>`
        : `<button class="btn btn-primary btn-sm" data-itg="qr-open">${icon('qr', 14)} ${t('c.connect')}</button>`
    },
    {
      id: 'meta', ic: 'facebook', color: '#2563eb', title: t('itg.meta'), desc: t('itg.metaDesc'),
      connected: I.meta.connected, meta: I.meta.connected ? 'WABA ' + (I.meta.waba || '—') : '',
      actions: `<button class="btn ${I.meta.connected ? 'btn-outline' : 'btn-primary'} btn-sm" data-itg="meta-open">${icon('settings', 14)} ${I.meta.connected ? t('c.configure') : t('c.connect')}</button>
        ${I.meta.connected ? `<button class="btn btn-ghost btn-sm" data-itg="meta-disc">${t('c.disconnect')}</button>` : ''}`
    },
    {
      id: 'google', ic: 'calendar', color: '#C9A227', title: t('itg.google'), desc: t('itg.googleDesc'),
      connected: I.google.connected, meta: I.google.connected ? `${t('itg.lastSync')}: ${t(relTime(I.google.lastSync).key, relTime(I.google.lastSync).params)}` : '',
      actions: I.google.connected
        ? `<button class="btn btn-soft btn-sm" data-itg="google-sync">${icon('refresh', 14)} ${t('itg.syncNow')}</button>
           <button class="btn btn-ghost btn-sm" data-itg="google-disc">${t('c.disconnect')}</button>`
        : `<button class="btn btn-primary btn-sm" data-itg="google-open">${icon('calendar', 14)} ${t('c.connect')}</button>`
    },
    {
      id: 'payments', ic: 'card', color: '#0f766e', title: t('itg.pay'), desc: t('itg.payDesc'),
      connected: I.payments.connected, meta: I.payments.connected ? `${I.payments.provider} · ${(I.payments.methods || ['pix']).length} ${t('itg.payMethods').toLowerCase()}` : '',
      actions: `<button class="btn ${I.payments.connected ? 'btn-outline' : 'btn-primary'} btn-sm" data-itg="pay-open">${icon('card', 14)} ${I.payments.connected ? t('c.configure') : t('c.connect')}</button>
        ${I.payments.connected ? `<button class="btn btn-ghost btn-sm" data-itg="pay-disc">${t('c.disconnect')}</button>` : ''}`
    },
    {
      id: 'crm', ic: 'table', color: '#4d7c0f', title: t('itg.crm'), desc: t('itg.crmDesc'),
      connected: I.crm.connected, meta: I.crm.connected ? 'Google Sheets' : '',
      actions: `<button class="btn ${I.crm.connected ? 'btn-ghost' : 'btn-outline'} btn-sm" data-itg="crm-toggle">${icon(I.crm.connected ? 'xCircle' : 'link', 14)} ${I.crm.connected ? t('c.disconnect') : t('c.connect')}</button>`
    },
    {
      id: 'webhook', ic: 'link', color: '#10201a', title: t('itg.webhook'), desc: t('itg.webhookDesc'),
      connected: I.webhook.connected, meta: I.webhook.connected ? I.webhook.url : '',
      actions: `<button class="btn ${I.webhook.connected ? 'btn-outline' : 'btn-dark'} btn-sm" data-itg="webhook-open">${icon('link', 14)} ${I.webhook.connected ? t('c.configure') : t('c.connect')}</button>`
    }
  ];
  return cards.map((c, i) => `
    <div class="card itg-card hoverable list-in" style="animation-delay:${i * 60}ms">
      <div class="itg-top">
        <span class="itg-ic" style="background:${c.color}15;color:${c.color};border:1.5px solid ${c.color}35">${icon(c.ic, 24)}</span>
        ${statusBadgeItg(c.connected)}
      </div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      ${c.meta ? `<div class="itg-meta truncate">${icon('info', 11)} ${esc(c.meta)}</div>` : ''}
      <div class="itg-foot">${c.actions}</div>
    </div>`).join('');
}

/* ---------------- QR Code ---------------- */
function openQRModal() {
  let seconds = 45;
  let seed = Math.floor(Math.random() * 99999);
  const m = openModal({
    title: t('itg.scanTitle'), subtitle: t('itg.qrDesc'), size: 'md',
    body: `<div class="qr-box">
      <div class="qr-frame" id="qr-frame">${qrSVG(seed)}</div>
      <div class="qr-timer">${icon('refresh', 14)} <span id="qr-secs">${t('itg.qrRefresh', { s: seconds })}</span></div>
      <div class="qr-steps">
        ${[t('itg.scan1'), t('itg.scan2'), t('itg.scan3')].map((s, i) => `<div class="qr-step"><span class="qr-step-num">${i + 1}</span><span>${s}</span></div>`).join('')}
      </div>
    </div>`,
    footer: `<button class="btn btn-outline" id="qr-new">${icon('refresh', 14)} ${t('itg.qrNew')}</button>
             <button class="btn btn-primary" id="qr-sim">${icon('whatsapp', 15)} ${t('c.connect')} (demo)</button>`,
    onClose: () => clearInterval(qrTimer),
    onMount: root => {
      const tick = () => {
        seconds--;
        const elS = root.querySelector('#qr-secs');
        if (elS) elS.textContent = t('itg.qrRefresh', { s: seconds });
        if (seconds <= 0) {
          seconds = 45; seed = Math.floor(Math.random() * 99999);
          const f = root.querySelector('#qr-frame');
          if (f) { f.innerHTML = qrSVG(seed); f.animate?.([{ opacity: .25, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 350, easing: 'ease-out' }); }
        }
      };
      clearInterval(qrTimer);
      qrTimer = setInterval(tick, 1000);
      root.querySelector('#qr-new').onclick = () => {
        seconds = 45; seed = Math.floor(Math.random() * 99999);
        root.querySelector('#qr-frame').innerHTML = qrSVG(seed);
        root.querySelector('#qr-secs').textContent = t('itg.qrRefresh', { s: seconds });
      };
      root.querySelector('#qr-sim').onclick = () => {
        clearInterval(qrTimer);
        state.integrations.qr.connected = true;
        commit('integrations');
        closeModal();
        toast(t('itg.qrSuccess'), 'success');
        addNotification('ev.replied', { name: 'WhatsApp', s: 1 }, 'whatsapp', { page: 'integrations' });
        rerender();
      };
    }
  });
}

/* ---------------- Meta API ---------------- */
function openMetaModal() {
  const I = state.integrations.meta;
  const webhookUrl = 'https://api.meatende.ai/webhook/whatsapp/vidaplena';
  const m = openModal({
    title: t('itg.meta'), subtitle: t('itg.metaDesc'), size: 'md',
    body: `
      <div class="field"><label>${t('itg.token')} *</label><input class="input" id="mt-token" type="password" value="${esc(I.token)}" placeholder="EAAG…"></div>
      <div class="field-row">
        <div class="field"><label>${t('itg.phoneId')} *</label><input class="input" id="mt-phone" value="${esc(I.phoneId)}" placeholder="1065400…"></div>
        <div class="field"><label>${t('itg.waba')} *</label><input class="input" id="mt-waba" value="${esc(I.waba)}" placeholder="102290…"></div>
      </div>
      <div class="field"><label>${t('itg.webhookUrl')}</label>
        <div class="webhook-url"><span>${webhookUrl}</span><button class="icon-btn" style="width:30px;height:30px" id="mt-copy">${icon('copy', 13)}</button></div>
      </div>
      <p class="field-hint">${icon('shield', 12)} ${t('ai.g4')} · Meta Graph API v20.0</p>`,
    footer: `<button class="btn btn-ghost" id="mt-cancel">${t('c.cancel')}</button>
             <button class="btn btn-primary" id="mt-save">${icon('check', 14)} ${t('itg.verify')}</button>`,
    onMount: root => {
      root.querySelector('#mt-copy').onclick = () => copyText(webhookUrl).then(() => toast(t('c.copied'), 'info', 1800));
      root.querySelector('#mt-cancel').onclick = closeModal;
      root.querySelector('#mt-save').onclick = () => {
        const token = root.querySelector('#mt-token').value.trim();
        const phoneId = root.querySelector('#mt-phone').value.trim();
        const waba = root.querySelector('#mt-waba').value.trim();
        if (!token || !phoneId || !waba) { toast(t('c.required'), 'warn'); return; }
        Object.assign(I, { token, phoneId, waba, connected: true });
        commit('integrations');
        closeModal(); toast(t('itg.metaOk'), 'success');
        rerender();
      };
    }
  });
}

/* ---------------- Google Agenda ---------------- */
function openGoogleModal() {
  const m = openModal({
    title: t('itg.google'), subtitle: t('itg.googleDesc'), size: 'sm',
    body: `
      <div style="text-align:center;padding:10px 0 16px">
        <span class="itg-ic" style="background:#C9A22715;color:#C9A227;border:1.5px solid #C9A22735;margin:0 auto 12px;width:60px;height:60px">${icon('calendar', 30)}</span>
        <p style="font-size:13px">${t('itg.googleDesc')}</p>
      </div>
      <div class="field"><label>Conta Google</label><input class="input" id="gg-account" value="agenda@vidaplena.com.br"></div>`,
    footer: `<button class="btn btn-ghost" id="gg-cancel">${t('c.cancel')}</button>
             <button class="btn btn-primary" id="gg-save">${icon('check', 14)} ${t('c.connect')}</button>`,
    onMount: root => {
      root.querySelector('#gg-cancel').onclick = closeModal;
      root.querySelector('#gg-save').onclick = () => {
        state.integrations.google.connected = true;
        state.integrations.google.account = root.querySelector('#gg-account').value.trim();
        state.integrations.google.lastSync = Date.now();
        commit('integrations');
        closeModal(); toast(t('itg.connectedToast', { name: t('itg.google') }), 'success');
        rerender();
      };
    }
  });
}

/* ---------------- Pagamentos ---------------- */
const PAY_PROVIDERS = ['Mercado Pago', 'Stripe', 'Asaas', 'PagBank', 'PayPal', 'PicPay', 'Stone', 'Cielo', 'Getnet', 'Banco Inter'];
const PAY_METHODS = ['pix', 'credit', 'debit', 'boleto', 'link', 'wallet', 'pixinstall'];

function openPayModal() {
  const I = state.integrations.payments;
  I.methods ||= ['pix', 'credit', 'link'];
  const m = openModal({
    title: t('itg.pay'), subtitle: t('itg.payDesc'), size: 'md',
    body: `
      <div class="field-row">
        <div class="field"><label>${t('itg.payProvider')}</label>
          <select class="select" id="py-provider">
            ${PAY_PROVIDERS.map(p => `<option ${I.provider === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select></div>
        <div class="field"><label>${t('itg.payPix')}</label><input class="input" id="py-pix" value="${esc(I.pixKey)}"></div>
      </div>
      <div class="field"><label>${t('itg.payKey')}</label><input class="input" id="py-key" type="password" placeholder="APP_USR-… / sk_live_…"></div>
      <div class="field"><label>${t('itg.payMethods')}</label>
        <div class="pay-methods">
          ${PAY_METHODS.map(mm => `<label class="pay-method"><input type="checkbox" data-pym="${mm}" ${I.methods.includes(mm) ? 'checked' : ''}><span>${t('itg.m.' + mm)}</span></label>`).join('')}
        </div>
      </div>`,
    footer: `<button class="btn btn-ghost" id="py-cancel">${t('c.cancel')}</button>
             <button class="btn btn-primary" id="py-save">${icon('check', 14)} ${t('c.save')}</button>`,
    onMount: root => {
      root.querySelector('#py-cancel').onclick = closeModal;
      root.querySelector('#py-save').onclick = () => {
        I.provider = root.querySelector('#py-provider').value;
        I.pixKey = root.querySelector('#py-pix').value.trim();
        I.methods = [...root.querySelectorAll('[data-pym]:checked')].map(c => c.dataset.pym);
        I.connected = true;
        commit('integrations');
        closeModal(); toast(t('itg.payOk'), 'success');
        rerender();
      };
    }
  });
}

/* ---------------- Webhook ---------------- */
function openWebhookModal() {
  const I = state.integrations.webhook;
  const m = openModal({
    title: t('itg.webhook'), subtitle: t('itg.webhookDesc'), size: 'sm',
    body: `
      <div class="field"><label>${t('itg.webhookUrl')} *</label><input class="input" id="wh-url" value="${esc(I.url)}" placeholder="https://seusistema.com/webhook"></div>
      <div class="field"><label>Eventos</label>
        ${['lead.created', 'appointment.booked', 'payment.received', 'chat.escalated'].map((e, i) => `
          <div class="guard-row"><span class="mono" style="font-size:12px">${e}</span><input type="checkbox" checked style="accent-color:#0E9F6E;width:16px;height:16px"></div>`).join('')}
      </div>`,
    footer: `<button class="btn btn-ghost" id="wh-cancel">${t('c.cancel')}</button>
             <button class="btn btn-primary" id="wh-save">${icon('check', 14)} ${t('c.save')}</button>`,
    onMount: root => {
      root.querySelector('#wh-cancel').onclick = closeModal;
      root.querySelector('#wh-save').onclick = () => {
        const url = root.querySelector('#wh-url').value.trim();
        if (!url) { toast(t('c.required'), 'warn'); return; }
        I.url = url; I.connected = true;
        commit('integrations');
        closeModal(); toast(t('itg.connectedToast', { name: 'Webhook' }), 'success');
        rerender();
      };
    }
  });
}

function rerender() {
  const grid = $('#itg-grid');
  if (grid) { grid.innerHTML = cardsHTML(); wire(); }
}

function wire() {
  const I = state.integrations;
  const on = (act, fn) => $$(`[data-itg="${act}"]`).forEach(b => b.onclick = fn);
  on('qr-open', openQRModal);
  on('qr-disc', () => { I.qr.connected = false; commit('integrations'); toast(t('itg.disconnectedToast', { name: 'WhatsApp QR' }), 'warn'); rerender(); });
  on('meta-open', openMetaModal);
  on('meta-disc', () => { I.meta.connected = false; commit('integrations'); toast(t('itg.disconnectedToast', { name: 'Meta API' }), 'warn'); rerender(); });
  on('google-open', openGoogleModal);
  on('google-sync', () => {
    I.google.lastSync = Date.now(); commit('integrations');
    toast(t('itg.synced', { n: state.appointments.length }), 'success'); rerender();
  });
  on('google-disc', () => { I.google.connected = false; commit('integrations'); toast(t('itg.disconnectedToast', { name: t('itg.google') }), 'warn'); rerender(); });
  on('pay-open', openPayModal);
  on('pay-disc', () => { I.payments.connected = false; commit('integrations'); toast(t('itg.disconnectedToast', { name: t('itg.pay') }), 'warn'); rerender(); });
  on('crm-toggle', () => {
    I.crm.connected = !I.crm.connected; commit('integrations');
    toast(t(I.crm.connected ? 'itg.connectedToast' : 'itg.disconnectedToast', { name: t('itg.crm') }), I.crm.connected ? 'success' : 'warn');
    rerender();
  });
  on('webhook-open', openWebhookModal);
}

export default {
  render() {
    const connected = Object.values(state.integrations).filter(i => i.connected).length;
    return `
      ${sectionHead(t('itg.title'), t('itg.sub'), badge(`${connected}/6 ${t('c.connected').toLowerCase()}`, 'green', 'plug'))}
      <div class="rep-insight">
        ${icon('whatsapp', 22)}
        <div><b>${t('itg.qr')} × ${t('itg.meta')}</b><p>${t('itg.qrDesc')} ${t('itg.metaDesc')}</p></div>
      </div>
      <div class="itg-grid" id="itg-grid">${cardsHTML()}</div>`;
  },
  mount() { wire(); return () => clearInterval(qrTimer); }
};
