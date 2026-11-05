'use strict';
const express = require('express');
const { asyncHandler, authRequired } = require('../middleware');
const { can, publicUser, ROLE_PERMISSIONS } = require('../rbac');

function build(prisma) {
  const router = express.Router();
  router.use(authRequired(prisma));
  router.get('/', asyncHandler(async (req, res) => {
    const clinicId = req.user.clinicId;
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, include: { setting: true } });
    const [doctors, apptTypes, integrations] = await Promise.all([
      prisma.doctor.findMany({ where: { clinicId }, orderBy: { name: 'asc' } }),
      prisma.appointmentType.findMany({ where: { clinicId }, orderBy: { name: 'asc' } }),
      prisma.integration.findMany({ where: { clinicId } })
    ]);
    const payload = {
      mode: 'api',
      user: publicUser(req.user),
      permissions: ROLE_PERMISSIONS[req.user.role] || [],
      clinic,
      setting: clinic.setting,
      doctors,
      apptTypes,
      integrations
    };
    if (can(req.user.role, 'patients:read')) payload.patients = await prisma.patient.findMany({ where: { clinicId }, orderBy: { name: 'asc' }, take: 500 });
    if (can(req.user.role, 'appointments:read')) payload.appointments = await prisma.appointment.findMany({ where: { clinicId }, orderBy: [{ date: 'asc' }, { time: 'asc' }], take: 1000 });
    if (can(req.user.role, 'users:read')) payload.users = (await prisma.user.findMany({ where: { clinicId } })).map(publicUser);
    if (can(req.user.role, 'audit:read')) payload.audit = await prisma.auditLog.findMany({ where: { clinicId }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(payload);
  }));
  return router;
}
module.exports = { build };
