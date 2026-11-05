import { t } from './i18n.js';
import { login } from './api.js';
import { icon } from './icons.js';
import { esc } from './utils.js';

export function showLogin() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,15,16,.72);backdrop-filter:blur(8px)';
    overlay.innerHTML = `
      <div class="card" style="width:min(420px,100%);padding:28px;box-shadow:var(--sh-lg)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          ${icon('bot', 22)}<h2 style="margin:0;font-size:20px">${t('auth.title')}</h2>
        </div>
        <p class="muted" style="font-size:13px;margin:0 0 18px">${t('auth.subtitle')}</p>
        <form id="auth-form">
          <div class="field"><label for="auth-email">${t('auth.email')}</label>
            <input class="input" id="auth-email" type="email" autocomplete="username" required placeholder="admin@meatende.local"></div>
          <div class="field"><label for="auth-password">${t('auth.password')}</label>
            <input class="input" id="auth-password" type="password" autocomplete="current-password" required></div>
          <div id="auth-error" style="display:none;color:var(--red-500);font-size:12px;margin:8px 0"></div>
          <button class="btn btn-primary w-full" id="auth-submit" type="submit" style="margin-top:12px">${t('auth.enter')}</button>
        </form>
        <p class="muted" style="font-size:11px;margin:14px 0 0">${t('auth.localNotice')}</p>
      </div>`;
    document.body.appendChild(overlay);
    const form = overlay.querySelector('#auth-form');
    const err = overlay.querySelector('#auth-error');
    const btn = overlay.querySelector('#auth-submit');
    overlay.querySelector('#auth-email').focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.style.display = 'none';
      btn.disabled = true; btn.textContent = t('auth.entering');
      try {
        const data = await login(overlay.querySelector('#auth-email').value.trim(), overlay.querySelector('#auth-password').value);
        overlay.remove();
        resolve(data);
      } catch (ex) {
        err.textContent = esc(ex.message || t('auth.failed'));
        err.style.display = 'block';
        btn.disabled = false; btn.textContent = t('auth.enter');
      }
    });
  });
}
