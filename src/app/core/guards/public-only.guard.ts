import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Prevents already-authenticated users from reaching public-only pages
 * such as /login and /signup.
 *
 * - Not authenticated → allows navigation (returns true)
 * - Authenticated     → redirects to /dashboard
 *
 * Usage in routes:
 *   canActivate: [publicOnlyGuard]
 */
export const publicOnlyGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;

  return router.createUrlTree(['/dashboard']);
};
