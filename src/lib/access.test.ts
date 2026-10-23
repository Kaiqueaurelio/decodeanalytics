import { describe, expect, test } from 'vitest';
import { hasAdministratorAccess, hasStaffAccess } from './access';

describe('role-based access', () => {
  test('administrator has full access regardless of role row order', () => {
    expect(hasStaffAccess(['aguardando_aprovacao', 'administrador'])).toBe(true);
    expect(hasAdministratorAccess(['aguardando_aprovacao', 'administrador'])).toBe(true);
  });
  test('an account without an administrator grant has no administrator access', () => {
    expect(hasAdministratorAccess([])).toBe(false);
    expect(hasAdministratorAccess(['atendente'])).toBe(false);
    expect(hasAdministratorAccess(['alcateias@admin.br'])).toBe(false);
  });
  test('pending and revoked accounts have no staff access', () => {
    expect(hasStaffAccess(['aguardando_aprovacao'])).toBe(false);
    expect(hasStaffAccess([])).toBe(false);
  });
});