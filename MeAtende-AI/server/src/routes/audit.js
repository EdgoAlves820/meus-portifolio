'use strict';
const express = require('express');
const { asyncHandler, authRequired, requirePerm } = require('../middleware');

function build(prisma) {
  const router = express.Router();
  router.use(authRequired(prisma));
  router.get('/', requirePerm('audit:read'), asyncHandler(async (req, res) => {
    const logs = await prisma.auditLog.findMany({
      where: { clinicId: req.user.clinicId },
      orderBy: { createdAt: 'desc' }, take: Math.min(500, Number(req.query.limit || 100)),
      include: { user: { select: { name: true, email: true } } }
    });
    res.json(logs.map(l => ({ ...l, meta: safeParse(l.meta) })));
  }));
  return router;
}
function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
module.exports = { build };
