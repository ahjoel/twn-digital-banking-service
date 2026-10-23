import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { Login } from './login';

describe('Login', () => {
  let httpMock: HttpTestingController;
  let router: Router;

  function setup(returnUrl: string | null = null) {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) } },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    return fixture;
  }

  function fillAndSubmit(fixture: ReturnType<typeof setup>, username: string, password: string) {
    const el = fixture.nativeElement as HTMLElement;
    const user = el.querySelector<HTMLInputElement>('#username')!;
    const pass = el.querySelector<HTMLInputElement>('#password')!;
    user.value = username;
    user.dispatchEvent(new Event('input'));
    pass.value = password;
    pass.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const okResponse = {
    token: 'jwt-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    username: 'tom@mybank.com',
    role: 'CUSTOMER',
  };

  afterEach(() => httpMock.verify());

  it('does not call the API when the form is empty', () => {
    const fixture = setup();
    fillAndSubmit(fixture, '', '');
    httpMock.expectNone('/api/auth/login');
  });

  it('logs in and redirects to /home', () => {
    const fixture = setup();
    fillAndSubmit(fixture, 'tom@mybank.com', 'tom');

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ username: 'tom@mybank.com', password: 'tom' });
    req.flush(okResponse);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it('shows a generic error and clears the password on 401', () => {
    const fixture = setup();
    fillAndSubmit(fixture, 'tom@mybank.com', 'wrong');

    httpMock
      .expectOne('/api/auth/login')
      .flush({ error: 'Invalid username or password' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Invalid username or password');
    expect(el.querySelector<HTMLInputElement>('#password')!.value).toBe('');
  });

  it('ignores an external returnUrl (open redirect)', () => {
    const fixture = setup('//evil.example.com');
    fillAndSubmit(fixture, 'tom@mybank.com', 'tom');
    httpMock.expectOne('/api/auth/login').flush(okResponse);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
  });
});
