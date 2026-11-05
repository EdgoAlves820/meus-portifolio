'use strict';
const express = require('express');
const { z } = require('zod');
const { asyncHandler, authRequired, requirePerm, audit } = require('../middleware');
const { publicUser } = require('../rbac');
const { hashPassword } = require('../auth');

const roles = ['GESTOR', 'SOCIO', 'GERENTE', 'DIRETOR', 'ATENDENTE'];
const createSchema = z.object({
  name: z.string().min(2), email: z.string().email(), password: z.string().min(10),
  role: z.enum(roles).default('ATENDENTE'), active: z.boolean().default(true)
});
const patchSchema = z.object({
  name: z.string().min(2).optional(), email: z.string().email().optional(),
  password: z.string().min(10).optional(), role: z.enum(roles).optional(), active: z.boolean().optional()
});

function build(prisma) {
  const router = express.Router();
  router.use(authRequired(prisma));

  router.get('/', requirePerm('users:read'), asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({ where: { clinicId: req.user.clinicId }, orderBy: { createdAt: 'asc' } });
    res.json(users.map(publicUser));
  }));

  router.post('/', requirePerm('users:write'), asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const user = await prisma.user.create({
      data: { clinicId: req.user.clinicId, name: data.name, email: data.email.toLowerCase(), role: data.role, active: data.active, passwordHash: await hashPassword(data.password) }
    });
    await audit(prisma, req, 'create', 'user', user.id, { role: user.role });
    res.status(201).json(publicUser(user));
  }));

  router.patch('/:id', requirePerm('users:write'), asyncHandler(async (req, res) => {
    const data = patchSchema.parse(req.body);
    const existing = await prisma.user.findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const patch = { ...data };
    if (patch.email) patch.email = patch.email.toLowerCase();
    if (patch.password) { patch.passwordHash = await hashPassword(patch.password); delete patch.password; }
    const user = await prisma.user.update({ where: { id: existing.id }, data: patch });
    await audit(prisma, req, 'update', 'user', user.id, { role: user.role, active: user.active });
    res.json(publicUser(user));
  }));

  router.delete('/:id', requirePerm('users:write'), asyncHandler(async (req, res) => {
    const existing = await prisma.user.findFirst({ where: { id: req.params.id, clinicId: req.user.clinicId } });
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (existing.id === req.user.id) return res.status(400).json({ error: 'Você não pode desativar a si mesmo.' });
    const user = await prisma.user.update({ where: { id: existing.id }, data: { active: false } });
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit(prisma, req, 'deactivate', 'user', user.id);
    res.json(publicUser(user));
  }));

  return router;
}
module.exports = { build };
