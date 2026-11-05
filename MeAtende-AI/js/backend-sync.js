/* Hidrata o estado a partir da API e sincroniza alterações locais de volta.
   Mantém a demo intacta: só atua quando mode === "api". */
import { state, commit, DOCTORS } from './store.js';
import { bus } from './utils.js';
import { api, isApiMode, setPermissions, can } from './api.js';
import { setRates, getRates } from './i18n.js';
import { toast } from './ui.js';
import { t } from './i18n.js';

let snapshot = new Map();
let syncing = false;
let timer = null;
let settingsTimer = null;
let started = false;

function toFront(a) {
  return { id: a.id, date: a.date, time: a.time, duration: a.duration, patient: a.patientName, doctor: a.doctorId || '', type: a.typeId || '', status: a.status, source: a.source || 'manual', notes: a.notes || '' };
}
function toBack(a) {
  return { id: a.id, patientName: a.patient, doctorId: a.doctor || null, typeId: a.type || null, date: a.date, time: a.time, duration: a.duration || 45, status: a.status || 'confirmed', source: a.source || 'manual', notes: a.notes || '' };
}
function takeSnapshot() { snapshot = new Map(state.appointments.map(a => [a.id, JSON.stringify(toBack(a))])); }

export async function hydrateFromApi() {
  if (!isApiMode()) return;
  const b = await api.get('/bootstrap');
  setPermissions(b.permissions);
  if (b.setting) setRates(b.setting.exchangeUsd, b.setting.exchangeEur);
  state.settings.profile = {
    ...state.settings.profile,
    name: b.clinic?.name || state.settings.profile.name,
    segment: b.clinic?.segment || '',
    phone: b.clinic?.phone || '',
    address: b.clinic?.address || '',
    greeting: b.clinic?.greeting || '',
    role: b.user?.role || 'gestor'
  };
  state.autopilot = b.setting?.autopilot ?? state.autopilot;
  DOCTORS.length = 0;
  (b.doctors || []).forEach(d => DOCTORS.push({ id: d.id, name: d.name, spec: d.spec }));
  state.apptTypes = (b.apptTypes || []).map(x => ({ id: x.id, name: x.name, duration: x.duration, price: x.price, color: x.color }));
  state.appointments = (b.appointments || []).map(toFront);
  state.patients = b.patients || [];
  state.users = b.users || [];
  state.audit = b.audit || [];
  state.integrationsApi = b.integrations || [];
  // Modo real não mistura pacientes/conversas fictícias da demo.
  state.chats = [];
  state.queue = [];
  state.issues = [];
  state.notifications = [];
  state.activity = [];
  state.internalChat = [];
  state.funnel = (state.funnel || []).map(c => ({ ...c, items: [] }));
  try { state.metrics = await api.get('/metrics?days=1825'); } catch {}
  takeSnapshot();
  commit('reset');
}

async function syncAppointments() {
  if (!isApiMode() || syncing) return;
  syncing = true;
  try {
    const current = new Map(state.appointments.map(a => [a.id, a]));
    for (const [id, a] of current) {
      const serialized = JSON.stringify(toBack(a));
      if (!snapshot.has(id)) await api.post('/appointments', toBack(a));
      else if (snapshot.get(id) !== serialized) await api.patch(`/appointments/${encodeURIComponent(id)}`, toBack(a));
    }
    for (const id of snapshot.keys()) if (!current.has(id)) await api.del(`/appointments/${encodeURIComponent(id)}`);
    takeSnapshot();
  } catch (e) {
    toast(e.message || t('api.syncError'), 'error');
    try {
      const rows = await api.get('/appointments');
      state.appointments = rows.map(toFront);
      takeSnapshot();
      commit('appointments');
    } catch {}
  } finally { syncing = false; }
}

async function syncSettings() {
  if (!isApiMode() || syncing) return;
  if (!can('settings:write')) return;
  syncing = true;
  try {
    const p = state.settings.profile || {};
    const r = getRates();
    await api.patch('/settings', { name: p.name, segment: p.segment, phone: p.phone, address: p.address, greeting: p.greeting, exchangeUsd: r.usd, exchangeEur: r.eur, autopilot: !!state.autopilot });
  } catch (e) { toast(e.message || t('api.syncError'), 'error'); }
  finally { syncing = false; }
}

export function startApiSync() {
  if (!isApiMode() || started) return;
  started = true;
  bus.on('appointments', () => { clearTimeout(timer); timer = setTimeout(syncAppointments, 350); });
  bus.on('settings', () => { clearTimeout(settingsTimer); settingsTimer = setTimeout(syncSettings, 500); });
  bus.on('autopilot', () => { clearTimeout(settingsTimer); settingsTimer = setTimeout(syncSettings, 500); });
}
