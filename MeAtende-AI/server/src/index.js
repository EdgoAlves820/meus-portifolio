'use strict';
const config = require('./config');
const { prisma } = require('./prisma');
const { createApp } = require('./app');

const app = createApp(prisma);
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`MeAtende AI API ouvindo em http://0.0.0.0:${config.port}`);
});

async function shutdown() {
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
