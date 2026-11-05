'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const config = require('./config');
const { errorHandler } = require('./middleware');

function createApp(prisma) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.corsOrigin ? config.corsOrigin.split(',').map(s => s.trim()) : true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (!config.isProd) app.use(morgan('dev'));

  app.get('/api/health', (req, res) => res.json({ ok: true, mode: 'api', time: new Date().toISOString() }));

  app.use('/api/auth', require('./routes/auth').build(prisma));
  app.use('/api/bootstrap', require('./routes/bootstrap').build(prisma));
  app.use('/api/users', require('./routes/users').build(prisma));
  app.use('/api/patients', require('./routes/patients').build(prisma));
  app.use('/api/appointments', require('./routes/appointments').build(prisma));
  const catalog = require('./routes/catalog').build(prisma);
  app.use('/api/doctors', catalog.doctors);
  app.use('/api/appt-types', catalog.types);
  app.use('/api/settings', require('./routes/settings').build(prisma));
  app.use('/api/integrations', require('./routes/integrations').build(prisma));
  app.use('/api/audit', require('./routes/audit').build(prisma));
  app.use('/api/metrics', require('./routes/metrics').build(prisma));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

  // Modo real: o backend serve o frontend e injeta configuração de API.
  app.get('/config.js', (req, res) => {
    res.type('application/javascript').send('window.MEATENDE_CONFIG = { mode: "api", apiBaseUrl: "/api" };\n');
  });

  const publicDir = config.publicDir;
  app.use((req, res, next) => {
    if (/^\/(server|node_modules|\.git|\.env)/i.test(req.path)) return res.status(404).end();
    next();
  });
  app.use(express.static(publicDir, { dotfiles: 'deny', index: 'index.html' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicDir, 'index.html'), err => { if (err) next(); });
  });

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
