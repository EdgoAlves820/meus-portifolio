'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-1234567890';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-1234567890';
process.env.ADMIN_PASSWORD = 'Teste@123456';

const dbPath = path.join(__dirname, '..', 'prisma', 'test.db');
for (const f of [dbPath, dbPath + '-journal']) { try { fs.unlinkSync(f); } catch {} }
execSync('npx prisma migrate deploy', { cwd: path.join(__dirname, '..'), env: process.env, stdio: 'ignore' });

const { prisma } = require('../src/prisma');
const { createApp } = require('../src/app');
const { hashPassword } = require('../src/auth');

let app, clinic, adminToken, socioToken;

test.before(async () => {
  clinic = await prisma.clinic.create({ data: { name: 'Clínica Teste' } });
  await prisma.setting.create({ data: { clinicId: clinic.id } });
  await prisma.user.create({ data: { clinicId: clinic.id, email: 'admin@test.local', name: 'Admin', role: 'GESTOR', passwordHash: await hashPassword('Teste@123456') } });
  await prisma.user.create({ data: { clinicId: clinic.id, email: 'socio@test.local', name: 'Sócio', role: 'SOCIO', passwordHash: await hashPassword('Teste@123456') } });
  await prisma.doctor.create({ data: { id: 'd-test', clinicId: clinic.id, name: 'Dr. Teste', spec: 'Geral' } });
  app = createApp(prisma);
  const a = await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'Teste@123456' });
  adminToken = a.body.accessToken;
  const s = await request(app).post('/api/auth/login').send({ email: 'socio@test.local', password: 'Teste@123456' });
  socioToken = s.body.accessToken;
});

test.after(async () => { await prisma.$disconnect(); });

test('health', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('login inválido retorna 401', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'errada' });
  assert.equal(res.status, 401);
});

test('bootstrap exige autenticação', async () => {
  const res = await request(app).get('/api/bootstrap');
  assert.equal(res.status, 401);
});

test('RBAC: sócio não cria paciente', async () => {
  const res = await request(app).post('/api/patients').set('Authorization', `Bearer ${socioToken}`).send({ name: 'Paciente' });
  assert.equal(res.status, 403);
});

test('admin cria paciente e agendamento futuro', async () => {
  const p = await request(app).post('/api/patients').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Paciente Teste', phone: '79999990000' });
  assert.equal(p.status, 201);
  const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const a = await request(app).post('/api/appointments').set('Authorization', `Bearer ${adminToken}`).send({ patientName: 'Paciente Teste', patientId: p.body.id, doctorId: 'd-test', date, time: '10:00' });
  assert.equal(a.status, 201);
  assert.equal(a.body.date, date);
});

test('agendamento no passado é bloqueado', async () => {
  const res = await request(app).post('/api/appointments').set('Authorization', `Bearer ${adminToken}`).send({ patientName: 'Passado', date: '2020-01-01', time: '10:00' });
  assert.equal(res.status, 400);
});

test('auditoria registra ações', async () => {
  const res = await request(app).get('/api/audit').set('Authorization', `Bearer ${adminToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.length > 0);
});
