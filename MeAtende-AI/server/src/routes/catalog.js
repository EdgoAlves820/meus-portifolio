'use strict';
const express = require('express');
const { z } = require('zod');
const { asyncHandler, authRequired, requirePerm, audit } = require('../middleware');

const doctorSchema = z.object({ id: z.string().optional(), name: z.string().min(2), spec: z.string().default(''), active: z.boolean().default(true) });
const typeSchema = z.object({ id: z.string().optional(), name: z.string().min(2), duration: z.number().int().min(5).max(480).default(45), price: z.number().int().min(0).default(0), color: z.string().default('#2D8182') });

function crud(router, prisma, model, entity, schema, permWrite) {
  router.get('/', requirePerm('catalog:read'), asyncHandler(async (req, res) => {
    res.json(await prisma[model].findMany({ where: { clinicId: req.user.clinicId }, orderBy: { name: 'asc' } }));
  }));
  router.post('/', requirePerm(permWrite), asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const row = await prisma[model].create({ data: { ...data, clinicId: req.user.clinicId } });
    await audit(prisma, req, 'create', entity, row.id);
    res.status(201).json(row);
  }));
  router.patch('/:id', requirePerm(permWrite), asyncHandler(async (req, res) => {
    const data = schema.partial().parse(req.body);
    const existing = await prisma[model].findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return res.status(404).json({ error: 'Registro não encontrado.' });
    const row = await prisma[model].update({ where: { id: existing.id }, data });
    await audit(prisma, req, 'update', entity, row.id);
    res.json(row);
  }));
  router.delete('/:id', requirePerm(permWrite), asyncHandler(async (req, res) => {
    const existing = await prisma[model].findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return res.status(404).json({ error: 'Registro não encontrado.' });
    await prisma[model].delete({ where: { id: existing.id } });
    await audit(prisma, req, 'delete', entity, existing.id);
    res.json({ ok: true });
  }));
}

function build(prisma) {
  const doctors = express.Router(); doctors.use(authRequired(prisma)); crud(doctors, prisma, 'doctor', 'doctor', doctorSchema, 'catalog:write');
  const types = express.Router(); types.use(authRequired(prisma)); crud(types, prisma, 'appointmentType', 'appointmentType', typeSchema, 'catalog:write');
  return { doctors, types };
}
module.exports = { build };
