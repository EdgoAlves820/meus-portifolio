'use strict';
const express = require('express');
const { z } = require('zod');
const { asyncHandler, authRequired, requirePerm, audit } = require('../middleware');

const patchSchema = z.object({
  name: z.string().min(2).optional(), segment: z.string().optional(), phone: z.string().optional(),
  address: z.string().optional(), greeting: z.string().optional(),
  exchangeUsd: z.number().positive().optional(), exchangeEur: z.number().positive().optional(), autopilot: z.boolean().optional()
});

function build(prisma) {
  const router = express.Router();
  router.use(authRequired(prisma));

  router.get('/', requirePerm('settings:read'), asyncHandler(async (req, res) => {
    const clinic = await prisma.clinic.findUnique({ where: { id: req.user.clinicId }, include: { setting: true } });
    res.json({ clinic, setting: clinic.setting });
  }));

  router.patch('/', requirePerm('settings:write'), asyncHandler(async (req, res) => {
    const data = patchSchema.parse(req.body);
    const clinicData = {};
    for (const k of ['name', 'segment', 'phone', 'address', 'greeting']) if (data[k] !== undefined) clinicData[k] = data[k];
    const settingData = {};
    for (const k of ['exchangeUsd', 'exchangeEur', 'autopilot']) if (data[k] !== undefined) settingData[k] = data[k];
    const clinic = await prisma.clinic.update({ where: { id: req.user.clinicId }, data: clinicData });
    const setting = await prisma.setting.upsert({ where: { clinicId: req.user.clinicId }, create: { clinicId: req.user.clinicId, ...settingData }, update: settingData });
    await audit(prisma, req, 'update', 'settings', req.user.clinicId);
    res.json({ clinic, setting });
  }));

  return router;
}
module.exports = { build };
