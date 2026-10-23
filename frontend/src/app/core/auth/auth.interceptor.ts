import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

const LOGIN_URL = '/api/auth/login';

/**
 * Adds the Bearer token to calls to our own API only (relative /api/ URLs),
 * so the token is never sent to a third-party origin.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isOwnApi = req.url.startsWith('/api/');
  const isLogin = req.url === LOGIN_URL;

  const token = isOwnApi && !isLogin ? auth.getToken() : null;
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isOwnApi && !isLogin) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
