import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if authenticated AND has role 'admin' or 'fournisseur' (as specified in storefront logic)
  // Actually, we should check what AuthService says.
  
  if (authService.isAuthenticated()) {
    const user = authService.user$();
    const role = authService.profile$()?.['role'];
    
    // Principal admin always allowed
    if (user?.email?.toLowerCase() === 'acherie812@gmail.com') {
      return true;
    }

    if (role === 'admin' || role === 'manager_erp' || role === 'master_admin') {
      return true;
    }
    // If authenticated but not authorized, redirect to home
    router.navigate(['/']);
    return false;
  }

  // Redirect to login if not authenticated
  router.navigate(['/auth/login']);
  return false;
};
