import { describe, expect, test } from 'vitest';
import { hasAdministratorAccess, hasStaffAccess } from './access';

describe('role-based access', () => {
  test('administrator has full access regardless of role row order', () => {
    expect(hasStaffAccess(['aguardando_aprovacao', 'administrador'])).toBe(true);
    expect(hasAdministratorAccess(['aguardando_aprovacao', 'administrador'])).toBe(true);
  });
  test('known administrator aliases retain administrative and staff access', () => {
    for (const role of ['administrador', 'admin', 'super_admin']) {
      expect(hasStaffAccess([role])).toBe(true);
      expect(hasAdministratorAccess([role])).toBe(true);
    }
  });
  test('email text and non-admin roles never grant administrator access', () => {
    expect(hasAdministratorAccess([])).toBe(false);
    expect(hasAdministratorAccess(['atendente'])).toBe(false);
    expect(hasAdministratorAccess(['alcateias@admin.br'])).toBe(false);
    expect(hasAdministratorAccess(['aguardando_aprovacao'])).toBe(false);
  });
  test('pending and revoked accounts have no staff access', () => {
    expect(hasStaffAccess(['aguardando_aprovacao'])).toBe(false);
    expect(hasStaffAccess([])).toBe(false);
  });
});