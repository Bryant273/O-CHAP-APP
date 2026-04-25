import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const supplierGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const role = authService.profile$()?.['role'];
    
    // Principal admin can access everything
    if (authService.user$()?.email?.toLowerCase() === 'acherie812@gmail.com') {
      return true;
    }

    if (role === 'supplier' || role === 'fournisseur') {
      return true;
    }
    router.navigate(['/']);
    return false;
  }
  router.navigate(['/auth/login']);
  return false;
};
