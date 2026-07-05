import { authStore, getCurrentRole } from './authService.js';

/**
 * Mengecek apakah user saat ini boleh mengakses rute dengan role tertentu.
 * @param {string[]} allowedRoles - contoh: ['admin'], ['seller'], atau [] untuk publik
 */
export function canAccess(allowedRoles = []) {
  if (allowedRoles.length === 0) return true;
  const role = getCurrentRole();
  return allowedRoles.includes(role);
}

export function requireAuth(allowedRoles, onDenied) {
  const { user, loading } = authStore.getState();
  if (loading) return 'loading';
  if (!user || !canAccess(allowedRoles)) {
    onDenied?.();
    return false;
  }
  return true;
}
