export const STAFF_ROLES = ['administrador', 'atendente', 'producao', 'financeiro', 'vendedor'] as const;

export function hasStaffAccess(roles: readonly string[]): boolean {
  return roles.some(role => STAFF_ROLES.some(allowed => allowed === role));
}

export function hasAdministratorAccess(roles: readonly string[]): boolean {
  return roles.includes('administrador');
}