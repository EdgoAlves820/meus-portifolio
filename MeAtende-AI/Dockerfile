FROM node:20-alpine

WORKDIR /app

# Backend
COPY server/package*.json ./server/
RUN cd server && npm ci

COPY server/prisma ./server/prisma
RUN cd server && npx prisma generate

COPY server/src ./server/src

# Frontend estático servido pelo backend (sem a pasta server)
COPY index.html config.js MeAtendeAI.html ./public/
COPY css ./public/css
COPY js ./public/js
COPY assets ./public/assets

ENV NODE_ENV=production \
    PORT=3000 \
    PUBLIC_DIR=/app/public \
    DATABASE_URL=file:/data/meatende.db

WORKDIR /app/server
VOLUME ["/data"]
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
