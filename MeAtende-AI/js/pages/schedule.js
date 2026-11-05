/* =====================================================================
   MeAtende AI — pages/schedule.js
   Agenda semanal/diária, tipos de consulta e horários da clínica.
   Seg–Sex 07:00–16:30 · Sáb 08:00–13:00 · Dom fechado.
   ===================================================================== */
import { t } from '../i18n.js';
import { loc } from '../content.js';
import { icon } from '../icons.js';
import { $, $$, esc, money, dateKey, parseKey, addDays, minutesOf, hhmm, fmtDate, fmtDateNum, uid } from '../utils.js';
import { state, HOURS, DOCTORS, addAppointment, updateAppointment, deleteAppointment, commit } from '../store.js';
import { toast, openModal, closeModal, confirmModal, badge, statusBadge, sectionHead, emptyState } from '../ui.js';
import { donut } from '../charts.js';

const START = 7 * 60, END = 16 * 60 + 30, SLOT_H = 44, SLOT_MIN = 30;
const ROWS = (END - START) / SLOT_MIN;
let weekOffset = 0;
let view = 'week';
let dayDate = dateKey(new Date());

function mondayOf(d) { const x = new Date(d); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); return x; }
function hoursFor(dow) { return HOURS[dow]; }
function hoursLabel(dow) { const h = hoursFor(dow); return h ? `${h.open}–${h.close}` : t('hours.closed'); }

function eventsFor(dateStr) {
  return state.appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
}

function eventHTML(a) {
  const type = state.apptTypes.find(x => x.id === a.type);
  const top = (minutesOf(a.time) - START) / SLOT_MIN * SLOT_H;
  const height = Math.max(30, (a.duration || 45) / SLOT_MIN * SLOT_H - 4);
  if (top < 0) return '';
  return `<div class="week-event ${a.status}" data-event="${a.id}" style="top:${top}px;height:${height}px;background:${type?.color || '#0E9F6E'}">
    <b>${esc(a.time)} · ${esc(a.patient)}</b><small>${esc(loc(type?.name || ''))}</small>
  </div>`;
}

function dayColumnHTML(d) {
  const key = dateKey(d);
  const dow = d.getDay();
  const h = hoursFor(dow);
  let slots = '';
  for (let r = 0; r < ROWS; r++) {
    const mins = START + r * SLOT_MIN;
    const closed = !h || mins < minutesOf(h.open) || mins >= minutesOf(h.close);
    slots += `<div class="week-slot ${closed ? 'closed' : ''}" data-slot-date="${key}" data-slot-time="${hhmm(mins)}" ${closed ? '' : `title="${t('sched.clickSlot')}"`}></div>`;
  }
  const now = new Date();
  let nowLine = '';
  if (key === dateKey(now)) {
    const mins = now.getHours() * 60 + now.getMinutes();
    if (mins >= START && mins <= END) nowLine = `<div class="now-line" style="top:${(mins - START) / SLOT_MIN * SLOT_H}px"></div>`;
  }
  return `<div class="week-col" data-col="${key}">
    ${slots}
    ${eventsFor(key).map(eventHTML).join('')}
    ${nowLine}
    ${!h ? `<div class="closed-banner"><span>${t('hours.closed')}</span></div>` : ''}
  </div>`;
}

function weekHTML() {
  const monday = addDays(mondayOf(new Date()), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const todayKey = dateKey(new Date());
  return `<div class="week-scroll"><div class="week-grid">
    <div class="week-corner"></div>
    ${days.map(d => `<button type="button" class="week-day-head week-day-btn ${dateKey(d) === todayKey ? 'today' : ''}" data-day="${dateKey(d)}" title="${t('sched.listView')}">
      <small>${t('day.short.' + d.getDay())}</small><b>${d.getDate()}</b>
      <span class="day-hours">${hoursLabel(d.getDay())}</span>
    </button>`).join('')}
    <div class="week-times">${Array.from({ length: ROWS }, (_, r) => `<div class="week-time">${r % 2 === 0 ? hhmm(START + r * SLOT_MIN) : ''}</div>`).join('')}</div>
    ${days.map(dayColumnHTML).join('')}
  </div></div>`;
}

function dayHTML() {
  const d = parseKey(dayDate);
  const todayKey = dateKey(new Date());
  return `<div class="week-scroll"><div class="week-grid" style="grid-template-columns:54px 1fr;min-width:0">
    <div class="week-corner"></div>
    <div class="week-day-head ${dayDate === todayKey ? 'today' : ''}">
      <small>${t('day.' + d.getDay())}</small><b>${d.getDate()}</b>
      <span class="day-hours">${hoursLabel(d.getDay())}</span>
    </div>
    <div class="week-times">${Array.from({ length: ROWS }, (_, r) => `<div class="week-time">${r % 2 === 0 ? hhmm(START + r * SLOT_MIN) : ''}</div>`).join('')}</div>
    ${dayColumnHTML(d)}
  </div></div>`;
}

function rangeLabel() {
  if (view === 'day') return fmtDate(parseKey(dayDate), { weekday: 'long', day: '2-digit', month: 'long' });
  const monday = addDays(mondayOf(new Date()), weekOffset * 7);
  const sunday = addDays(monday, 6);
  return `${fmtDate(monday)} – ${fmtDate(sunday, { day: '2-digit', month: 'long' })}`;
}

function sidePanelHTML() {
  const today = eventsFor(dateKey(new Date()));
  const totalSlots = 19;
  const occ = Math.min(100, Math.round(today.reduce((s, a) => s + (a.duration || 45), 0) / (totalSlots * SLOT_MIN) * 100));
  const weekMonday = mondayOf(new Date());
  const weekKeys = Array.from({ length: 7 }, (_, i) => dateKey(addDays(weekMonday, i)));
  const weekAppts = state.appointments.filter(a => weekKeys.includes(a.date) && a.status !== 'cancelled');
  const weekRevenue = weekAppts.reduce((s, a) => s + (state.apptTypes.find(x => x.id === a.type)?.price || 0), 0);
  return `
    <div class="card">
      <div class="card-head"><div class="card-title">${icon('activity', 16)} ${t('sched.occupancy')}</div></div>
      <div style="display:flex;align-items:center;gap:16px">
        ${donut({ value: occ, label: occ + '%', sub: t('c.today'), size: 104, stroke: 11 })}
        <div style="display:grid;gap:8px;font-size:12px">
          <div><b style="font-size:17px">${today.length}</b><br><span class="muted">${t('sched.todayCount')}</span></div>
          <div><b style="font-size:17px">${weekAppts.length}</b><br><span class="muted">${t('sched.perWeek')}</span></div>
          <div><b style="font-size:15px" class="text-green">${money(weekRevenue, true)}</b><br><span class="muted">${t('sched.revenueWeek')}</span></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">
        <div class="card-title">${icon('layers', 16)} ${t('sched.types')}</div>
        <button class="btn btn-soft btn-xs" id="add-type">${icon('plus', 12)} ${t('sched.addType')}</button>
      </div>
      ${state.apptTypes.map(ty => `
        <div class="type-row">
          <span class="type-color" style="background:${ty.color}"></span>
          <div class="type-info"><b>${esc(loc(ty.name))}</b><small>${t('sched.minutes', { n: ty.duration })}</small></div>
          <span class="type-price">${money(ty.price, true)}</span>
          <button class="icon-btn danger" style="width:28px;height:28px" data-del-type="${ty.id}">${icon('trash', 13)}</button>
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">${icon('clock', 16)} ${t('hours.title')}</div></div>
      ${[1, 2, 3, 4, 5, 6, 0].map(dow => `
        <div class="hours-edit-row" style="grid-template-columns:1fr auto">
          <span>${t('day.' + dow)}</span>
          <b class="${hoursFor(dow) ? 'text-green' : 'text-red'}">${hoursLabel(dow)}</b>
        </div>`).join('')}
      <p class="field-hint mt-2">${icon('sparkles', 11)} ${t('hours.ai247')}</p>
    </div>`;
}

/* ---------------- Modais ---------------- */
function timeOptions(dateStr, selected) {
  const dow = parseKey(dateStr).getDay();
  const h = hoursFor(dow);
  if (!h) return `<option value="">${t('hours.closed')}</option>`;
  const opts = [];
  for (let m = minutesOf(h.open); m + 30 <= minutesOf(h.close); m += 30) {
    const v = hhmm(m);
    opts.push(`<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`);
  }
  return opts.join('');
}

function openApptModal(prefill = {}) {
  const date = prefill.date || dateKey(new Date());
  const m = openModal({
    title: t('sched.new'), subtitle: t('sched.sub'), size: 'md',
    body: `
      <div class="field"><label>${t('sched.patient')} *</label><input class="input" id="ap-patient" placeholder="${t('c.name')}" value="${esc(prefill.patient || '')}"></div>
      <div class="field-row">
        <div class="field"><label>${t('sched.apptType')}</label>
          <select class="select" id="ap-type">${state.apptTypes.map(ty => `<option value="${ty.id}">${esc(loc(ty.name))} · ${money(ty.price, true)}</option>`).join('')}</select></div>
        <div class="field"><label>${t('sched.professional')}</label>
          <select class="select" id="ap-doctor">${DOCTORS.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>${t('c.date')}</label><input class="input" type="date" id="ap-date" value="${date}"></div>
        <div class="field"><label>${t('c.time')}</label><select class="select" id="ap-time">${timeOptions(date, prefill.time)}</select></div>
      </div>
      <div class="field"><label>${t('c.status')}</label>
        <select class="select" id="ap-status">
          <option value="confirmed">${t('sched.status.confirmed')}</option>
          <option value="pending">${t('sched.status.pending')}</option>
        </select></div>
      <p class="field-hint">${icon('info', 12)} ${t('hours.weekdays')}: 07:00–16:30 · ${t('hours.sat')}: 08:00–13:00 · ${t('hours.sun')}: ${t('hours.closed')}</p>`,
    footer: `<button class="btn btn-ghost" id="ap-cancel">${t('c.cancel')}</button>
             <button class="btn btn-primary" id="ap-save">${icon('check', 15)} ${t('c.confirm')}</button>`,
    onMount: root => {
      root.querySelector('#ap-date').addEventListener('change', e => {
        root.querySelector('#ap-time').innerHTML = timeOptions(e.target.value);
      });
      root.querySelector('#ap-cancel').onclick = closeModal;
      root.querySelector('#ap-save').onclick = () => {
        const patient = root.querySelector('#ap-patient').value.trim();
        const type = root.querySelector('#ap-type').value;
        const doctor = root.querySelector('#ap-doctor').value;
        const d = root.querySelector('#ap-date').value;
        const time = root.querySelector('#ap-time').value;
        const status = root.querySelector('#ap-status').value;
        if (!patient || !d || !time) { toast(t('c.required'), 'warn'); return; }
        const dow = parseKey(d).getDay();
        const h = hoursFor(dow);
        if (!h) { toast(t('sched.closedDay'), 'error'); return; }
        const ty = state.apptTypes.find(x => x.id === type);
        const mins = minutesOf(time);
        if (mins < minutesOf(h.open) || mins + (ty?.duration || 45) > minutesOf(h.close)) {
          toast(t('sched.outside', { range: `${h.open}–${h.close}` }), 'error'); return;
        }
        const conflict = state.appointments.find(a => a.date === d && a.doctor === doctor && a.status !== 'cancelled' &&
          Math.abs(minutesOf(a.time) - mins) < Math.max(a.duration || 45, ty?.duration || 45));
        if (conflict) { toast(t('sched.conflict'), 'error'); return; }
        addAppointment({ date: d, time, patient, doctor, type, status, duration: ty?.duration || 45, source: 'manual' });
        closeModal();
        toast(t('sched.created'), 'success');
        refreshPage();
      };
    }
  });
}

function openEventModal(id) {
  const a = state.appointments.find(x => x.id === id);
  if (!a) return;
  const ty = state.apptTypes.find(x => x.id === a.type);
  const doc = DOCTORS.find(d => d.id === a.doctor);
  const m = openModal({
    title: a.patient, subtitle: `${fmtDate(parseKey(a.date), { weekday: 'long' })} · ${fmtDateNum(parseKey(a.date))} · ${a.time}`, size: 'sm',
    body: `
      <div style="display:grid;gap:10px;font-size:13px">
        <div class="list-row" style="margin:0">${icon('layers', 16)}<div class="flex-1"><b>${esc(loc(ty?.name || ''))}</b><br><small class="muted">${t('sched.minutes', { n: a.duration || 45 })} · ${money(ty?.price || 0)}</small></div>${statusBadge(a.status)}</div>
        <div class="list-row" style="margin:0">${icon('user', 16)}<div class="flex-1"><b>${esc(doc?.name || '')}</b><br><small class="muted">${esc(loc(doc?.spec || ''))}</small></div></div>
        <div class="list-row" style="margin:0">${icon(a.source === 'sophia' ? 'sparkles' : 'edit', 16)}<div class="flex-1"><b>${a.source === 'sophia' ? 'Sophia AI' : t('wa.filter.human')}</b><br><small class="muted">${t('wa.aiActions')}</small></div></div>
      </div>`,
    footer: `
      <button class="btn btn-danger btn-sm" id="ev-del">${icon('trash', 13)} ${t('c.delete')}</button>
      ${a.status !== 'cancelled' ? `<button class="btn btn-outline btn-sm" id="ev-cancel">${icon('xCircle', 13)} ${t('sched.status.cancelled')}</button>` : ''}
      ${a.status === 'pending' ? `<button class="btn btn-primary btn-sm" id="ev-confirm">${icon('check', 13)} ${t('c.confirm')}</button>` : ''}`,
    onMount: root => {
      root.querySelector('#ev-del').onclick = () => { deleteAppointment(id); closeModal(); toast(t('sched.cancelled'), 'info'); refreshPage(); };
      root.querySelector('#ev-cancel')?.addEventListener('click', () => { updateAppointment(id, { status: 'cancelled' }); closeModal(); toast(t('sched.cancelled'), 'info'); refreshPage(); });
      root.querySelector('#ev-confirm')?.addEventListener('click', () => { updateAppointment(id, { status: 'confirmed' }); closeModal(); toast(t('c.saved'), 'success'); refreshPage(); });
    }
  });
}

function openTypeModal() {
  const colors = ['#0E9F6E', '#C9A227', '#0f766e', '#111827', '#4d7c0f', '#a16207', '#065f46', '#2563eb'];
  const m = openModal({
    title: t('sched.addType'), size: 'sm',
    body: `
      <div class="field"><label>${t('c.name')} *</label><input class="input" id="ty-name" placeholder="Ex: Oftalmologia"></div>
      <div class="field-row">
        <div class="field"><label>${t('c.duration')} (${t('c.min')})</label><input class="input" type="number" id="ty-dur" value="45" min="15" step="15"></div>
        <div class="field"><label>${t('c.price')} (R$)</label><input class="input" type="number" id="ty-price" value="200" min="0"></div>
      </div>
      <div class="field"><label>Cor</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap" id="ty-colors">
          ${colors.map((c, i) => `<button class="type-color-btn" data-color="${c}" style="width:30px;height:30px;border-radius:9px;background:${c};border:3px solid ${i === 0 ? '#10201a' : 'transparent'};cursor:pointer"></button>`).join('')}
        </div></div>`,
    footer: `<button class="btn btn-ghost" id="ty-cancel">${t('c.cancel')}</button><button class="btn btn-primary" id="ty-save">${t('c.save')}</button>`,
    onMount: root => {
      let color = colors[0];
      root.querySelectorAll('[data-color]').forEach(b => b.onclick = () => {
        color = b.dataset.color;
        root.querySelectorAll('[data-color]').forEach(x => x.style.borderColor = x === b ? '#10201a' : 'transparent');
      });
      root.querySelector('#ty-cancel').onclick = closeModal;
      root.querySelector('#ty-save').onclick = () => {
        const name = root.querySelector('#ty-name').value.trim();
        if (!name) { toast(t('c.required'), 'warn'); return; }
        state.apptTypes.push({ id: 't' + uid(), name, duration: Number(root.querySelector('#ty-dur').value) || 45, price: Number(root.querySelector('#ty-price').value) || 0, color });
        commit('appointments');
        closeModal(); toast(t('sched.typeSaved'), 'success'); refreshPage();
      };
    }
  });
}

let refreshFn = null;
function refreshPage() { refreshFn?.(); }

export default {
  render() {
    return `
      ${sectionHead(t('sched.title'), t('sched.sub'), `<button class="btn btn-primary" id="new-appt">${icon('plus', 16)} ${t('sched.new')}</button>`)}
      <div class="sched-layout">
        <div>
          <div class="sched-toolbar">
            <div class="sched-nav">
              <button class="icon-btn" id="sch-prev">${icon('chevronLeft', 17)}</button>
              <button class="btn btn-outline btn-sm" id="sch-today">${t('c.today')}</button>
              <button class="icon-btn" id="sch-next">${icon('chevronRight', 17)}</button>
              <span class="sched-range" id="sch-range">${rangeLabel()}</span>
              <input type="date" class="input sch-jump" id="sch-jump" value="${view === 'day' ? dayDate : dateKey(new Date())}" title="${t('c.date')}">
            </div>
            <div class="tabs" style="flex-shrink:0">
              <button class="tab ${view === 'week' ? 'active' : ''}" data-view="week">${icon('calendarDays', 14)} ${t('sched.weekView')}</button>
              <button class="tab ${view === 'day' ? 'active' : ''}" data-view="day">${icon('calendar', 14)} ${t('sched.listView')}</button>
            </div>
          </div>
          <div id="sch-grid">${view === 'week' ? weekHTML() : dayHTML()}</div>
          <p class="field-hint mt-2">${icon('info', 12)} ${t('sched.clickSlot')} · <span style="color:#dc2626">—</span> ${t('c.today')}</p>
        </div>
        <div class="dash-col" id="sch-side">${sidePanelHTML()}</div>
      </div>`;
  },
  mount(root) {
    const rerenderGrid = () => {
      $('#sch-grid').innerHTML = view === 'week' ? weekHTML() : dayHTML();
      $('#sch-range').textContent = rangeLabel();
      $('#sch-side').innerHTML = sidePanelHTML();
      wireGrid(); wireSide();
    };
    refreshFn = rerenderGrid;
    const wireGrid = () => {
      $$('.week-slot:not(.closed)', root).forEach(s => s.onclick = () => openApptModal({ date: s.dataset.slotDate, time: s.dataset.slotTime }));
      $$('.week-event', root).forEach(ev => ev.onclick = e => { e.stopPropagation(); openEventModal(ev.dataset.event); });
      $$('[data-day]', root).forEach(h => h.onclick = () => {
        dayDate = h.dataset.day; view = 'day';
        $$('[data-view]', root).forEach(x => x.classList.toggle('active', x.dataset.view === 'day'));
        rerenderGrid();
      });
    };
    const wireSide = () => {
      $('#add-type')?.addEventListener('click', openTypeModal);
      $$('[data-del-type]', root).forEach(b => b.onclick = () => confirmModal({
        title: t('c.delete'), message: t('sched.typeDeleted') + '?', danger: true, confirmLabel: t('c.delete'),
        onConfirm: () => { state.apptTypes = state.apptTypes.filter(x => x.id !== b.dataset.delType); commit('appointments'); toast(t('sched.typeDeleted'), 'info'); rerenderGrid(); }
      }));
    };
    wireGrid(); wireSide();
    $('#new-appt')?.addEventListener('click', () => openApptModal());
    $('#sch-prev')?.addEventListener('click', () => { if (view === 'week') weekOffset--; else dayDate = dateKey(addDays(parseKey(dayDate), -1)); rerenderGrid(); });
    $('#sch-next')?.addEventListener('click', () => { if (view === 'week') weekOffset++; else dayDate = dateKey(addDays(parseKey(dayDate), 1)); rerenderGrid(); });
    $('#sch-today')?.addEventListener('click', () => { weekOffset = 0; dayDate = dateKey(new Date()); rerenderGrid(); });
    $$('[data-view]', root).forEach(b => b.onclick = () => {
      view = b.dataset.view;
      $$('[data-view]', root).forEach(x => x.classList.toggle('active', x === b));
      rerenderGrid();
    });
    /* Salto direto para uma data */
    $('#sch-jump')?.addEventListener('change', e => {
      if (!e.target.value) return;
      dayDate = e.target.value; view = 'day';
      $$('[data-view]', root).forEach(x => x.classList.toggle('active', x.dataset.view === 'day'));
      rerenderGrid();
    });
    /* Deslizar (swipe) para navegar entre datas — toque e arrastar */
    const grid = $('#sch-grid');
    if (grid) {
      let sx = 0, sy = 0, swiping = false;
      grid.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true; }, { passive: true });
      grid.addEventListener('touchend', e => {
        if (!swiping) return; swiping = false;
        const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          if (dx < 0) { if (view === 'week') weekOffset++; else dayDate = dateKey(addDays(parseKey(dayDate), 1)); }
          else { if (view === 'week') weekOffset--; else dayDate = dateKey(addDays(parseKey(dayDate), -1)); }
          rerenderGrid();
        }
      }, { passive: true });
      /* Roda do mouse horizontal / trackpad também navega */
      let wheelLock = 0;
      grid.addEventListener('wheel', e => {
        if (Math.abs(e.deltaX) < 25 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
        const now = Date.now(); if (now - wheelLock < 500) return; wheelLock = now;
        if (e.deltaX > 0) { if (view === 'week') weekOffset++; else dayDate = dateKey(addDays(parseKey(dayDate), 1)); }
        else { if (view === 'week') weekOffset--; else dayDate = dateKey(addDays(parseKey(dayDate), -1)); }
        rerenderGrid();
      }, { passive: true });
    }
    return () => { refreshFn = null; };
  }
};
