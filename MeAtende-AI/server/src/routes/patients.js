'use strict';
const express = require('express');
const { z } = require('zod');
const { asyncHandler, authRequired, requirePerm, audit } = require('../middleware');

const schema = z.object({ name: z.string().min(2), phone: z.string().default(''), email: z.string().email().or(z.literal('')).default(''), notes: z.string().default('') });
const patchSchema = schema.partial();

function build(prisma) {
  const router = express.Router();
  router.use(authRequired(prisma));

  router.get('/', requirePerm('patients:read'), asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const patients = await prisma.patient.findMany({
      where: { clinicId: req.user.clinicId, ...(q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : {}) },
      orderBy: { name: 'asc' }, take: 200
    });
    res.json(patients);
  }));

  router.post('/', requirePerm('patients:write'), asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const patient = await prisma.patient.create({ data: { ...data, clinicId: req.user.clinicId } });
    await audit(prisma, req, 'create', 'patient', patient.id);
    res.status(201).json(patient);
  }));

  router.patch('/:id', requirePerm('patients:write'), asyncHandler(async (req, res) => {
    const data = patchSchema.parse(req.body);
    const existing = await prisma.patient.findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return res.status(404).json({ error: 'Paciente não encontrado.' });
    const patient = await prisma.patient.update({ where: { id: existing.id }, data });
    await audit(prisma, req, 'update', 'patient', patient.id);
    res.json(patient);
  }));

  router.delete('/:id', requirePerm('patients:delete'), asyncHandler(async (req, res) => {
    const existing = await prisma.patient.findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return res.status(404).json({ error: 'Paciente não encontrado.' });
    await prisma.patient.delete({ where: { id: existing.id } });
    await audit(prisma, req, 'delete', 'patient', existing.id);
    res.json({ ok: true });
  }));

  return router;
}
module.exports = { build };
