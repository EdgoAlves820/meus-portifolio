'use strict';
const { verifyAccessToken } = require('./auth');
const { can } = require('./rbac');

function asyncHandler(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }

function authRequired(prisma) {
  return asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Não autenticado.' });
    let payload;
    try { payload = verifyAccessToken(token); } catch { return res.status(401).json({ error: 'Sessão expirada ou inválida.' }); }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) return res.status(401).json({ error: 'Usuário inválido ou inativo.' });
    req.user = { id: user.id, clinicId: user.clinicId, role: user.role, email: user.email, name: user.name };
    next();
  });
}

function requirePerm(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
    if (!can(req.user.role, permission)) return res.status(403).json({ error: 'Sem permissão para esta ação.' });
    next();
  };
}

async function audit(prisma, req, action, entity, entityId, meta = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        clinicId: req.user?.clinicId || meta.clinicId || '',
        userId: req.user?.id || null,
        action, entity, entityId: entityId || null,
        meta: JSON.stringify(meta),
        ip: req.ip || ''
      }
    });
  } catch { /* auditoria não deve derrubar a operação principal */ }
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'Dados inválidos.', details: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })) });
  }
  if (err?.code === 'P2002') return res.status(409).json({ error: 'Registro duplicado.' });
  if (err?.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado.' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Erro interno.' : (err.message || 'Erro.') });
}

module.exports = { asyncHandler, authRequired, requirePerm, audit, errorHandler };
