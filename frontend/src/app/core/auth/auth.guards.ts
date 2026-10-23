import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Protected pages: redirects to /login and remembers where the user wanted to go. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.getToken()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Login page: an already authenticated user is sent to the home page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.getToken() ? inject(Router).createUrlTree(['/home']) : true;
};
