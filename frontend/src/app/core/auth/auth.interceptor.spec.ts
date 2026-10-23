import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    TestBed.inject(AuthService)
      .login({ username: 'tom@mybank.com', password: 'tom' })
      .subscribe();
    httpMock.expectOne('/api/auth/login').flush({
      token: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      username: 'tom@mybank.com',
      role: 'CUSTOMER',
    });
  });

  afterEach(() => httpMock.verify());

  it('adds the Bearer token to our own API calls', () => {
    http.get('/api/payments/check-status').subscribe();
    const req = httpMock.expectOne('/api/payments/check-status');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });

  it('never sends the token to another origin', () => {
    http.get('https://example.com/api/data').subscribe();
    const req = httpMock.expectOne('https://example.com/api/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('logs out when the API answers 401', () => {
    const auth = TestBed.inject(AuthService);
    http.get('/api/payments/check-status').subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/payments/check-status')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isAuthenticated()).toBe(false);
  });
});
