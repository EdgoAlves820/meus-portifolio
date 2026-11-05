'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const env = process.env;
const isProd = env.NODE_ENV === 'production';

function secret(name, devFallback) {
  const v = env[name];
  if (v && v.length >= 16) return v;
  if (isProd) throw new Error(`${name} deve ser definido com pelo menos 16 caracteres em produção.`);
  return devFallback;
}

module.exports = {
  isProd,
  port: Number(env.PORT || 3000),
  databaseUrl: env.DATABASE_URL || 'file:./dev.db',
  accessSecret: secret('JWT_ACCESS_SECRET', 'dev-access-secret-change-me-please'),
  refreshSecret: secret('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me-please'),
  accessTtl: env.ACCESS_TOKEN_TTL || '15m',
  refreshDays: Number(env.REFRESH_TOKEN_DAYS || 7),
  corsOrigin: env.CORS_ORIGIN || '',
  cookieSecure: env.COOKIE_SECURE === 'true',
  publicDir: env.PUBLIC_DIR || path.join(__dirname, '..', '..'),
  admin: {
    email: (env.ADMIN_EMAIL || 'admin@meatende.local').toLowerCase(),
    password: env.ADMIN_PASSWORD || 'Troque@123456',
    name: env.ADMIN_NAME || 'Administrador',
    clinicName: env.CLINIC_NAME || 'Clínica Vida Plena'
  }
};
