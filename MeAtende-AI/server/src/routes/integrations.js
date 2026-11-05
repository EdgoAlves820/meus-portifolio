'use strict';
const express = require('express');
const { z } = require('zod');
const { asyncHandler, authRequired, requirePerm, audit } = require('../middleware');

const PROVIDERS = ['whatsapp', 'llm', 'google_calendar', 'payments', 'crm', 'webhook'];
const patchSchema = z.object({ enabled: z.boolean().optional(), mode: z.enum(['sandbox']).default('sandbox'), config: z.record(z.any()).optional() });

function build(prisma) {
  const router = express.Router();
  router.use(authRequired(prisma));

  router.get('/', requirePerm('integrations:read'), asyncHandler(async (req, res) => {
    const rows = await prisma.integration.findMany({ where: { clinicId: req.user.clinicId } });
    const byProvider = Object.fromEntries(rows.map(r => [r.provider, r]));
    res.json(PROVIDERS.map(p => byProvider[p] || { provider: p, enabled: false, mode: 'sandbox', config: '{}' }));
  }));

  router.patch('/:provider', requirePerm('integrations:write'), asyncHandler(async (req, res) => {
    const provider = req.params.provider;
    if (!PROVIDERS.includes(provider)) return res.status(404).json({ error: 'Provedor desconhecido.' });
    const data = patchSchema.parse(req.body);
    const row = await prisma.integration.upsert({
      where: { clinicId_provider: { clinicId: req.user.clinicId, provider } },
      create: { clinicId: req.user.clinicId, provider, enabled: data.enabled ?? false, mode: 'sandbox', config: JSON.stringify(data.config || {}) },
      update: { enabled: data.enabled ?? undefined, mode: 'sandbox', config: data.config ? JSON.stringify(data.config) : undefined }
    });
    await audit(prisma, req, 'update', 'integration', row.id, { provider, enabled: row.enabled });
    res.json(row);
  }));

  router.post('/:provider/test', requirePerm('integrations:write'), asyncHandler(async (req, res) => {
    const provider = req.params.provider;
    if (!PROVIDERS.includes(provider)) return res.status(404).json({ error: 'Provedor desconhecido.' });
    await audit(prisma, req, 'test', 'integration', provider, { mode: 'sandbox' });
    res.json({ ok: true, provider, mode: 'sandbox', message: 'Teste em sandbox concluído. Nenhuma chamada externa real foi realizada.' });
  }));

  return router;
}
module.exports = { build };
