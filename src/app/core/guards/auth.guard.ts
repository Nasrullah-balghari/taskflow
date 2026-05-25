import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protects routes that require authentication.
 *
 * - Authenticated  → allows navigation (returns true)
 * - Unauthenticated → redirects to /login, passing the attempted URL as
 *   ?returnUrl=<path> so the login page can send the user back afterwards.
 *
 * Usage in routes:
 *   canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  // Preserve the intended destination so login can redirect back.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
