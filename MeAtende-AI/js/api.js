/* Cliente HTTP do modo real (backend local/Docker). No modo demo, nada é chamado. */
const cfg = (typeof window !== 'undefined' && window.MEATENDE_CONFIG) || {};
export const API_MODE = cfg.mode === 'api';
const BASE = cfg.apiBaseUrl || '/api';

let accessToken = null;
let currentUser = null;
let permissions = [];

export function isApiMode() { return API_MODE; }
export function getUser() { return currentUser; }
export function getPermissions() { return permissions.slice(); }
export function setPermissions(list) { permissions = Array.isArray(list) ? list : []; }
export function can(permission) {
  if (!API_MODE) return true;
  if (permissions.includes('*') || permissions.includes(permission)) return true;
  const [resource] = String(permission).split(':');
  return permissions.includes(`${resource}:*`);
}

export class ApiError extends Error {
  constructor(message, status, details) { super(message); this.status = status; this.details = details; }
}

async function parse(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return text ? { error: text } : null; }
}

async function refreshSession() {
  const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new ApiError('Sessão expirada.', res.status);
  const data = await parse(res);
  accessToken = data.accessToken;
  currentUser = data.user;
  return data;
}

export async function tryRefresh() {
  if (!API_MODE) return null;
  try { return await refreshSession(); } catch { return null; }
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await parse(res);
  if (!res.ok) throw new ApiError(data?.error || 'Falha no login.', res.status, data?.details);
  accessToken = data.accessToken;
  currentUser = data.user;
  return data;
}

export async function logout() {
  try { await request('/auth/logout', { method: 'POST', retry: false }); } catch {}
  accessToken = null; currentUser = null; permissions = [];
}

export async function request(path, { method = 'GET', body, retry = true } = {}) {
  if (!API_MODE) throw new ApiError('Modo demo: API desativada.', 400);
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, { method, credentials: 'include', headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (res.status === 401 && retry && path !== '/auth/refresh') {
    try { await refreshSession(); return request(path, { method, body, retry: false }); } catch {}
  }
  const data = await parse(res);
  if (!res.ok) throw new ApiError(data?.error || `Erro ${res.status}.`, res.status, data?.details);
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' })
};
