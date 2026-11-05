'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');

const REFRESH_COOKIE = 'meatende_refresh';

async function hashPassword(plain) { return bcrypt.hash(plain, 12); }
async function verifyPassword(plain, hash) { return bcrypt.compare(plain, hash); }

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, clinicId: user.clinicId, role: user.role, email: user.email, name: user.name },
    config.accessSecret,
    { expiresIn: config.accessTtl }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.accessSecret);
}

function hashToken(raw) { return crypto.createHash('sha256').update(raw).digest('hex'); }

async function issueRefreshToken(prisma, userId) {
  const raw = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + config.refreshDays * 86400000);
  await prisma.refreshToken.create({ data: { userId, tokenHash: hashToken(raw), expiresAt } });
  return raw;
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/api/auth',
    maxAge: config.refreshDays * 86400000
  };
}

function setRefreshCookie(res, raw) { res.cookie(REFRESH_COOKIE, raw, refreshCookieOptions()); }
function clearRefreshCookie(res) { res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: 0 }); }

async function revokeRefreshToken(prisma, raw) {
  if (!raw) return;
  await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(raw), revokedAt: null }, data: { revokedAt: new Date() } });
}

module.exports = {
  REFRESH_COOKIE, hashPassword, verifyPassword, signAccessToken, verifyAccessToken,
  hashToken, issueRefreshToken, setRefreshCookie, clearRefreshCookie, revokeRefreshToken
};
