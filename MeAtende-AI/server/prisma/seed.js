'use strict';
const { PrismaClient } = require('@prisma/client');
const config = require('../src/config');
const { hashPassword } = require('../src/auth');

const prisma = new PrismaClient();

const DOCTORS = [
  ['d1', 'Dr. Carlos Eduardo', 'Cardiologia / Dermatologia'],
  ['d2', 'Dra. Juliana Paes', 'Odontologia'],
  ['d3', 'Dra. Renata Vieira', 'Clínica Geral / Pediatria'],
  ['d4', 'Dr. André Matos', 'Ortopedia / Fisioterapia'],
  ['d5', 'Dra. Paula Nunes', 'Nutrição / Endocrinologia'],
  ['d6', 'Dra. Fernanda Lopes', 'Neurologia'],
  ['d7', 'Dr. Ricardo Salles', 'Reumatologia / Geriatria'],
  ['d8', 'Dra. Beatriz Andrade', 'Pneumologia / Alergologia e Imunologia'],
  ['d9', 'Dr. Marcelo Tavares', 'Nefrologia / Urologia'],
  ['d10', 'Dra. Sofia Almeida', 'Ginecologia / Obstetrícia'],
  ['d11', 'Dr. Henrique Prado', 'Gastroenterologia / Endocrinologia'],
  ['d12', 'Dra. Letícia Moraes', 'Oftalmologia / Otorrinolaringologia']
];
const TYPES = [
  ['t1', 'Odontologia', 45, 250, '#2D8182'], ['t2', 'Oftalmologia', 40, 300, '#C9A227'],
  ['t3', 'Clínica Geral', 45, 220, '#0E9F6E'], ['t4', 'Cardiologia', 50, 350, '#E05252'],
  ['t5', 'Ortopedia', 45, 320, '#7C3AED'], ['t6', 'Fisioterapia', 50, 180, '#0EA5E9'],
  ['t7', 'Nutrição', 45, 200, '#84CC16'], ['t8', 'Neurologia', 50, 550, '#21575A'],
  ['t9', 'Reumatologia', 45, 480, '#F59E0B'], ['t10', 'Pneumologia', 40, 420, '#14B8A6'],
  ['t11', 'Nefrologia', 45, 460, '#6366F1'], ['t12', 'Geriatria', 50, 380, '#A855F7'],
  ['t13', 'Ginecologia', 40, 320, '#EC4899']
];
const PROVIDERS = ['whatsapp', 'llm', 'google_calendar', 'payments', 'crm', 'webhook'];

async function main() {
  let clinic = await prisma.clinic.findFirst();
  if (!clinic) {
    clinic = await prisma.clinic.create({ data: { name: config.admin.clinicName, segment: 'Clínicas', greeting: 'Olá! Sou a Sophia, assistente virtual. Como posso ajudar?' } });
  }
  await prisma.setting.upsert({ where: { clinicId: clinic.id }, create: { clinicId: clinic.id }, update: {} });

  const existingAdmin = await prisma.user.findUnique({ where: { email: config.admin.email } });
  if (!existingAdmin) {
    await prisma.user.create({ data: { clinicId: clinic.id, email: config.admin.email, name: config.admin.name, role: 'GESTOR', passwordHash: await hashPassword(config.admin.password) } });
    console.log(`Administrador criado: ${config.admin.email}`);
  } else {
    console.log(`Administrador já existe: ${config.admin.email} (senha não alterada pelo seed)`);
  }

  for (const [id, name, spec] of DOCTORS) await prisma.doctor.upsert({ where: { id }, create: { id, clinicId: clinic.id, name, spec }, update: { name, spec } });
  for (const [id, name, duration, price, color] of TYPES) await prisma.appointmentType.upsert({ where: { id }, create: { id, clinicId: clinic.id, name, duration, price, color }, update: { name, duration, price, color } });
  for (const provider of PROVIDERS) await prisma.integration.upsert({ where: { clinicId_provider: { clinicId: clinic.id, provider } }, create: { clinicId: clinic.id, provider, mode: 'sandbox' }, update: {} });

  console.log('Seed concluído.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
