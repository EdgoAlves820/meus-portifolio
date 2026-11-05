'use strict';
const express = require('express');
const { z } = require('zod');
const { asyncHandler, authRequired, requirePerm, audit } = require('../middleware');

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const timeRe = /^\d{2}:\d{2}$/;
const statusEnum = z.enum(['pending', 'confirmed', 'done', 'cancelled']);
const createSchema = z.object({
  id: z.string().min(3).max(64).optional(),
  patientId: z.string().nullable().optional(), patientName: z.string().min(2),
  doctorId: z.string().nullable().optional(), typeId: z.string().nullable().optional(),
  date: z.string().regex(dateRe), time: z.string().regex(timeRe),
  duration: z.number().int().min(5).max(480).default(45),
  status: statusEnum.default('confirmed'), source: z.string().default('manual'), notes: z.string().default('')
});
const patchSchema = createSchema.partial();

function minutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function slotDate(date, time) { return new Date(`${date}T${time}:00`); }

async function assertFutureAndFree(prisma, clinicId, data, ignoreId) {
  const when = slotDate(data.date, data.time);
  if (Number.isNaN(when.getTime())) { const e = new Error('Data/hora inválida.'); e.status = 400; throw e; }
  if (when.getTime() < Date.now() + 30 * 60000) { const e = new Error('Só é permitido agendar horários futuros com antecedência mínima de 30 minutos.'); e.status = 400; throw e; }
  const sameDay = await prisma.appointment.findMany({ where: { clinicId, date: data.date, status: { not: 'cancelled' }, ...(ignoreId ? { id: { not: ignoreId } } : {}) } });
  const start = minutes(data.time), end = start + (data.duration || 45);
  const conflict = sameDay.find(a => {
    if (data.doctorId && a.doctorId && a.doctorId !== data.doctorId) return false;
    const s = minutes(a.time), e = s + a.duration;
    return start < e && s < end;
  });
  if (conflict) { const e = new Error('Conflito de horário para este profissional/clínica.'); e.status = 409; throw e; }
}

function build(prisma) {
  const router = express.Router();
  router.use(authRequired(prisma));

  router.get('/', requirePerm('appointments:read'), asyncHandler(async (req, res) => {
    const where = { clinicId: req.user.clinicId };
    if (req.query.date) where.date = String(req.query.date);
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.from || req.query.to) where.date = { ...(req.query.from ? { gte: String(req.query.from) } : {}), ...(req.query.to ? { lte: String(req.query.to) } : {}) };
    const appointments = await prisma.appointment.findMany({ where, orderBy: [{ date: 'asc' }, { time: 'asc' }], take: 1000 });
    res.json(appointments);
  }));

  router.post('/', requirePerm('appointments:write'), asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    await assertFutureAndFree(prisma, req.user.clinicId, data);
    const appointment = await prisma.appointment.create({ data: { ...data, clinicId: req.user.clinicId } });
    await audit(prisma, req, 'create', 'appointment', appointment.id, { date: appointment.date, time: appointment.time });
    res.status(201).json(appointment);
  }));

  router.patch('/:id', requirePerm('appointments:write'), asyncHandler(async (req, res) => {
    const data = patchSchema.parse(req.body);
    const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return res.status(404).json({ error: 'Agendamento não encontrado.' });
    const merged = { ...existing, ...data };
    if ((data.date || data.time || data.duration || data.doctorId) && merged.status !== 'cancelled' && merged.status !== 'done') {
      await assertFutureAndFree(prisma, req.user.clinicId, merged, existing.id);
    }
    const appointment = await prisma.appointment.update({ where: { id: existing.id }, data });
    await audit(prisma, req, 'update', 'appointment', appointment.id, { status: appointment.status });
    res.json(appointment);
  }));

  router.delete('/:id', requirePerm('appointments:delete'), asyncHandler(async (req, res) => {
    const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return res.status(404).json({ error: 'Agendamento não encontrado.' });
    await prisma.appointment.delete({ where: { id: existing.id } });
    await audit(prisma, req, 'delete', 'appointment', existing.id);
    res.json({ ok: true });
  }));

  return router;
}
module.exports = { build };
