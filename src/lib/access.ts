// Keep these aliases aligned with role values stored in profiles.role.
// Access is granted only by an explicit role row, never by profile fields or email.
export const ADMIN_ROLES = ["administrador", "admin", "super_admin"] as const;
export const STAFF_ROLES = [
  ...ADMIN_ROLES,
  "atendente",
  "producao",
  "financeiro",
  "vendedor",
] as const;

export function hasStaffAccess(roles: readonly string[]): boolean {
  return roles.some((role) => STAFF_ROLES.some((allowed) => allowed === role));
}

export function hasAdministratorAccess(roles: readonly string[]): boolean {
  return roles.some((role) => ADMIN_ROLES.some((allowed) => allowed === role));
}
