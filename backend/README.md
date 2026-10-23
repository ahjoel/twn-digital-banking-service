# Backend — Digital Banking Customer Portal

Spring Boot 3.5 REST API (Java 21, Maven) with JWT authentication against a MySQL `users` table.

## Run

```bash
mvn spring-boot:run      # http://localhost:8085, dev profile
mvn test                 # tests use an in-memory H2 database, no MySQL needed
```

## Configuration

| Profile | Database | Schema | Seed users |
|---|---|---|---|
| `dev` (default) | MySQL `digitalbankingdb` | created/updated by Hibernate | `tom@mybank.com` / `tom`, `john.doe` / `Password123!` |
| `prod` | MySQL `digitalbankingdb` | run `src/main/resources/db/schema-mysql.sql` first | none |
| `test` | H2 in memory | created by Hibernate | same as `dev` |

Environment variables:

| Variable | Default |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` |
| `DB_URL` | `jdbc:mysql://localhost:3306/digitalbankingdb?...` |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / `root` |
| `JWT_SECRET` | dev-only key — **always override outside dev** (Base64, ≥ 256 bits) |
| `JWT_EXPIRATION_MS` | `3600000` (1 h) |

Passwords are stored as BCrypt hashes.

## API

### `POST /api/auth/login` — public

```json
{ "username": "tom@mybank.com", "password": "tom" }
```

`200`:
```json
{ "token": "eyJ...", "tokenType": "Bearer", "expiresIn": 3600, "username": "tom@mybank.com", "role": "CUSTOMER" }
```

`400` missing field · `401` invalid credentials · `403` disabled account.

### `GET /api/payments/check-status?reference=<ref>` — requires `Authorization: Bearer <token>`

`200` (sample data, `status` is random: `SUCCESS`, `PENDING` or `FAILED`):
```json
{
  "reference": "PAY-2026-0001",
  "transactionId": "TXN-123456789",
  "status": "PENDING",
  "statusDescription": "Payment is being processed",
  "amount": 150000.00,
  "currency": "XOF",
  "debtorAccount": "SN0120100100123456789012",
  "creditorAccount": "SN0120100100987654321098",
  "creditorName": "Sample Merchant Ltd",
  "paymentMethod": "TRANSFER",
  "createdAt": "2026-10-20T10:00:00Z",
  "updatedAt": "2026-10-20T10:05:00Z"
}
```

`401` missing, invalid or expired token.

## Project layout

```
src/main/java/com/digitalbanking/portal/
├── config/       SecurityConfig, DevDataInitializer
├── controller/   AuthController, PaymentController
├── dto/          request/response records
├── entity/       User (users table)
├── exception/    GlobalExceptionHandler
├── repository/   UserRepository
├── security/     JwtService, JwtAuthenticationFilter, CustomUserDetailsService
└── service/      AuthService, PaymentService
```
