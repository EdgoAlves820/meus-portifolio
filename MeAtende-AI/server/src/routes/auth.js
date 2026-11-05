'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const config = require('../config');
const { asyncHandler, authRequired, audit } = require('../middleware');
const { publicUser } = require('../rbac');
const {
  REFRESH_COOKIE, verifyPassword, signAccessToken, issueRefreshToken,
  setRefreshCookie, clearRefreshCookie, revokeRefreshToken, hashToken
} = require('../auth');

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function build(prisma) {
  const router = express.Router();
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Muitas tentativas. Tente novamente mais tarde.' } });

  router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { clinic: true } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    if (!user.active) return res.status(403).json({ error: 'Usuário inativo.' });
    const accessToken = signAccessToken(user);
    const refresh = await issueRefreshToken(prisma, user.id);
    setRefreshCookie(res, refresh);
    await audit(prisma, { user: { id: user.id, clinicId: user.clinicId }, ip: req.ip }, 'login', 'user', user.id);
    res.json({ accessToken, user: publicUser(user), clinic: { id: user.clinic.id, name: user.clinic.name } });
  }));

  router.post('/refresh', asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) return res.status(401).json({ error: 'Sem sessão.' });
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(raw) }, include: { user: true } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.active) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'Sessão expirada.' });
    }
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const next = await issueRefreshToken(prisma, stored.userId);
    setRefreshCookie(res, next);
    res.json({ accessToken: signAccessToken(stored.user), user: publicUser(stored.user) });
  }));

  router.post('/logout', asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    await revokeRefreshToken(prisma, raw);
    clearRefreshCookie(res);
    if (req.user) await audit(prisma, req, 'logout', 'user', req.user.id);
    res.json({ ok: true });
  }));

  router.get('/me', authRequired(prisma), asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { clinic: true } });
    res.json({ user: publicUser(user), clinic: { id: user.clinic.id, name: user.clinic.name } });
  }));

  return router;
}

module.exports = { build };
