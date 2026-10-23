# Frontend — Digital Banking Customer Portal

Angular 21 app: login page, then a portal with a **Home** and a **Payment status** menu.

## Prerequisites

- Node.js 22.12+
- Backend running on `http://localhost:8085` (see [`../backend`](../backend/README.md))

## Run

```bash
npm install        # if it fails with "reading 'edgesOut'", use: npx npm@11 install
npm start          # http://localhost:4200
npm test           # unit tests (Vitest)
npm run build      # production build in dist/
```

Sign in with `tom@mybank.com` / `tom`.

## Backend access

The dev server proxies every `/api/**` call to `http://localhost:8085` (`proxy.conf.json`), so the app only uses relative URLs and needs no CORS setup.
In production, serve the app and the API behind the same origin (reverse proxy) to keep this behaviour.

## Routes

| Path | Access |
|---|---|
| `/login` | guests only; signed-in users are redirected to `/home` |
| `/home` | signed-in users only; others go to `/login?returnUrl=...` |
| `/payments/status` | signed-in users only; checks a payment by reference (`GET /api/payments/check-status`) |

## Security

- JWT kept in `sessionStorage` (cleared on tab close) and removed automatically when it expires.
- `authInterceptor` adds the Bearer token to relative `/api/` calls only; a `401` logs the user out.
- `returnUrl` accepts internal paths only (no open redirect).
- Payment references are validated (`[A-Za-z0-9_-]`, max 50) and sent URL-encoded via `HttpParams`.
- Generic login error messages; the password field is cleared after a failure.
- Production builds include an automatic Content-Security-Policy (`security.autoCsp`); the dev server sends `X-Frame-Options`, `X-Content-Type-Options` and `Referrer-Policy`.

## Project layout

```
src/app/
├── core/auth/        AuthService, authInterceptor, authGuard / guestGuard, models
├── core/layout/      Shell: top bar, menu, sign out
├── features/login/   login page
├── features/home/    home page
├── features/payments/ payment status page + PaymentService
├── app.config.ts     HttpClient + interceptor, router
└── app.routes.ts     lazy-loaded routes
```
