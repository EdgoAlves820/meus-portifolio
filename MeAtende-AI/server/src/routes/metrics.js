'use strict';
const express = require('express');
const { asyncHandler, authRequired, requirePerm } = require('../middleware');

function dateKey(d) { return d.toISOString().slice(0, 10); }

function build(prisma) {
  const router = express.Router();
  router.use(authRequired(prisma));
  router.get('/', requirePerm('metrics:read'), asyncHandler(async (req, res) => {
    const days = Math.min(1825, Math.max(1, Number(req.query.days || 90)));
    const from = new Date(Date.now() - (days - 1) * 86400000);
    const fromKey = dateKey(from);
    const appts = await prisma.appointment.findMany({ where: { clinicId: req.user.clinicId, date: { gte: fromKey }, status: { not: 'cancelled' } }, include: { type: true } });
    const map = new Map();
    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 86400000);
      map.set(dateKey(d), { date: dateKey(d), revenue: 0, chats: 0, bookings: 0, slaOk: 100, aiShare: 0 });
    }
    for (const a of appts) {
      const row = map.get(a.date);
      if (!row) continue;
      row.bookings += 1;
      if (a.status === 'done' || a.status === 'confirmed') row.revenue += a.type?.price || 0;
    }
    res.json({ days: [...map.values()] });
  }));
  return router;
}
module.exports = { build };
