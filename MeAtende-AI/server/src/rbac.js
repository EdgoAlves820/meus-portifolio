'use strict';
const ROLE_PERMISSIONS = {
  GESTOR: ['*'],
  DIRETOR: [
    'users:read', 'users:write',
    'patients:read', 'patients:write', 'patients:delete',
    'appointments:read', 'appointments:write', 'appointments:delete',
    'catalog:read', 'catalog:write',
    'settings:read', 'settings:write',
    'integrations:read', 'integrations:write',
    'audit:read', 'metrics:read'
  ],
  SOCIO: ['patients:read', 'appointments:read', 'metrics:read', 'audit:read', 'catalog:read', 'settings:read'],
  GERENTE: [
    'patients:read', 'patients:write', 'patients:delete',
    'appointments:read', 'appointments:write', 'appointments:delete',
    'catalog:read', 'settings:read', 'metrics:read', 'integrations:read'
  ],
  ATENDENTE: ['patients:read', 'patients:write', 'appointments:read', 'appointments:write', 'catalog:read', 'metrics:read']
};

function can(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes('*') || perms.includes(permission)) return true;
  const [resource] = permission.split(':');
  return perms.includes(`${resource}:*`);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: String(user.role).toLowerCase(),
    active: user.active,
    clinicId: user.clinicId
  };
}

module.exports = { can, publicUser, ROLE_PERMISSIONS };
