import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.user$();
    const role = authService.profile$()?.['role'] as string;
    const allowedRoles = route.data?.['roles'] as string[];

    // Master admin bypass
    if (user?.email?.toLowerCase() === 'acherie812@gmail.com') {
      return true;
    }

    if (allowedRoles && allowedRoles.includes(role)) {
      return true;
    }

    // Default: unauthorized
    router.navigate(['/']);
    return false;
  }

  // Not authenticated
  router.navigate(['/auth/login']);
  return false;
};
