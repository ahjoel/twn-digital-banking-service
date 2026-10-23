# Digital Banking Customer Portal

Customer portal with a Spring Boot API, an Angular frontend and a MySQL database, fully containerized with Docker and orchestrated with Docker Compose.

```
digital-banking-customer-portal/
├── digital-docker-compose.yml   Orchestration of the 3 services (mysql, backend, frontend)
├── .env                         Variables injected into the compose file (not committed)
├── backend/                     Spring Boot 3.5 API (Java 21) — JWT auth, MySQL
│   ├── Dockerfile               Multi-stage: Maven build → JRE 21 Alpine
│   └── .dockerignore
└── frontend/                    Angular 21 app — login, payment status
    ├── Dockerfile               Multi-stage: Node 22 build → nginx 1.27 Alpine
    ├── nginx.conf               Static serving + /api reverse proxy to the backend
    └── .dockerignore
```

## Quick start with Docker Compose

Prerequisites: Docker Engine with the Compose plugin (`docker compose`).

```bash
# 1. Create the .env file at the project root (see "Environment variables" below)

# 2. Build the images and start the stack
docker compose -f digital-docker-compose.yml up -d --build

# 3. Follow the startup (mysql → backend → frontend)
docker compose -f digital-docker-compose.yml ps
docker compose -f digital-docker-compose.yml logs -f backend
```

| Service | URL on the host |
|---|---|
| Frontend (nginx) | http://localhost:`${FRONTEND_HOST_PORT}` (e.g. http://localhost) |
| Backend API | http://localhost:`${BACKEND_HOST_PORT}` (e.g. http://localhost:8085) |
| MySQL | `localhost:${MYSQL_HOST_PORT}` (e.g. `localhost:3307`) |

Sign in with `tom@mybank.com` / `tom`.

## Architecture

```
            Browser
               │  :FRONTEND_HOST_PORT
               ▼
   ┌──────────────────────────┐
   │ frontend (nginx :80)     │  Angular static files
   │   /api/*  ──proxy──┐     │
   └────────────────────┼─────┘
                        ▼
   ┌──────────────────────────┐
   │ backend (Spring :8085)   │  JWT auth, REST API
   └────────────┬─────────────┘
                ▼  jdbc:mysql://mysql:3306
   ┌──────────────────────────┐
   │ mysql (MySQL 8.4 :3306)  │  volume mysql-data
   └──────────────────────────┘
```

All three containers share the default Compose network: services reach each other by **service name** (`mysql`, `backend`), never by `localhost`. The browser only talks to nginx, which forwards `/api/*` to the backend — no CORS setup needed.

## Docker Compose services

The file is `digital-docker-compose.yml`. Startup order is enforced by healthchecks, not just by container start:

```
mysql (healthy) ──► backend (healthy) ──► frontend
```

### `mysql`

| Setting | Value |
|---|---|
| Image | `mysql:8.4` |
| Container | `dbank-mysql` |
| Port | `${MYSQL_HOST_PORT}:3306` |
| Volume | `mysql-data:/var/lib/mysql` (data survives `down`) |
| Init script | `backend/src/main/resources/db/schema-mysql.sql` mounted read-only into `/docker-entrypoint-initdb.d/` |
| Healthcheck | `mysql ... -e 'SELECT 1'` every 5 s, up to 20 retries, 30 s grace period |

- `MYSQL_ROOT_PASSWORD` comes from `DB_PASSWORD` and `MYSQL_DATABASE` from `DB_NAME`.
- The init script creates the `users` table and the default user `tom`. It **only runs on the first startup**, when the volume is empty. To replay it: `docker compose -f digital-docker-compose.yml down -v`.

### `backend`

| Setting | Value |
|---|---|
| Build | `./backend` (see [backend Dockerfile](#backend-dockerfile)) |
| Container | `dbank-backend` |
| Port | `${BACKEND_HOST_PORT}:8085` |
| Depends on | `mysql` with `condition: service_healthy` |
| Healthcheck | `nc -z localhost 8085` every 5 s, up to 20 retries, 40 s grace period |
| Environment | `SPRING_PROFILES_ACTIVE`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS` |

Spring Boot opens port 8085 only once the application context has started, i.e. after a successful database connection — so "port open" is a reliable readiness signal.

### `frontend`

| Setting | Value |
|---|---|
| Build | `./frontend` (see [frontend Dockerfile](#frontend-dockerfile)) |
| Container | `dbank-frontend` |
| Port | `${FRONTEND_HOST_PORT}:80` |
| Depends on | `backend` with `condition: service_healthy` |

## Dockerfiles

Both images use a **multi-stage build**: the build tools (Maven, Node) stay in the first stage and only the runtime artifact is copied into a small final image.

### Backend Dockerfile

`backend/Dockerfile`

| Stage | Base image | Role |
|---|---|---|
| `build` | `maven:3.9-eclipse-temurin-21` | `mvn dependency:go-offline`, then `mvn clean package -DskipTests` |
| runtime | `eclipse-temurin:21-jre-alpine` | Runs `java -jar /app/app.jar` on port 8085 |

- **Layer cache**: `pom.xml` is copied and dependencies downloaded *before* the sources, so editing Java code doesn't re-download dependencies.
- **JRE only** in the final image (no JDK, no Maven) → smaller image and attack surface.
- **Non-root user**: the app runs as the `spring` user.
- Tests are skipped during the image build (`-DskipTests`); run them separately with `mvn test`.
- `.dockerignore` excludes `target/`, `.idea/`, `.git/`, ...

Standalone build:

```bash
docker build -t dbank-backend ./backend
```

### Frontend Dockerfile

`frontend/Dockerfile`

| Stage | Base image | Role |
|---|---|---|
| `build` | `node:22-alpine` | `npm ci`, then `npm run build` |
| runtime | `nginx:1.27-alpine` | Serves `dist/digital-banking-portal/browser` on port 80 |

- **Layer cache**: `package.json` / `package-lock.json` are copied and `npm ci` runs *before* the sources.
- `.dockerignore` excludes `node_modules/`, `dist/`, `.angular/`, ... so the build context stays small and local artifacts don't leak into the image.
- `nginx.conf` replaces the dev `proxy.conf.json`:
  - `location /api/` → `proxy_pass http://backend:8085` (Compose service name);
  - hashed assets (`.js`, `.css`, fonts, images) cached for 1 year, `index.html` never cached;
  - SPA fallback: any unknown route serves `index.html` (Angular routing);
  - gzip enabled for text responses.

Standalone build:

```bash
docker build -t dbank-frontend ./frontend
```

> The frontend image is meant to run inside the Compose network: outside of it, nginx cannot resolve the `backend` host.

## Environment variables

`docker compose` automatically reads the `.env` file at the project root. It is listed in `.gitignore` — never commit it.

```dotenv
# --- Database ---
DB_PASSWORD=change-me
DB_NAME=digitalbankingdb
DB_USERNAME=root
DB_URL=jdbc:mysql://mysql:3306/digitalbankingdb?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true

# --- Backend ---
SPRING_PROFILES_ACTIVE=dev
JWT_SECRET=<base64 key, >= 256 bits — e.g. `openssl rand -base64 48`>
JWT_EXPIRATION_MS=3600000

# --- Ports exposed on the host machine ---
MYSQL_HOST_PORT=3307
BACKEND_HOST_PORT=8085
FRONTEND_HOST_PORT=80
```

| Variable | Used by | Notes |
|---|---|---|
| `DB_PASSWORD` | mysql, backend | MySQL root password |
| `DB_NAME` | mysql | Database created on first startup |
| `DB_USERNAME` | backend | Must be `root`: the compose file only sets the root password |
| `DB_URL` | backend | Host must be `mysql` (service name), port `3306` (container port) |
| `SPRING_PROFILES_ACTIVE` | backend | `dev` (Hibernate updates the schema) or `prod` (schema from the init script) |
| `JWT_SECRET` | backend | Always set a real secret outside dev |
| `JWT_EXPIRATION_MS` | backend | Token lifetime, `3600000` = 1 h |
| `*_HOST_PORT` | all | Host-side ports; `MYSQL_HOST_PORT=3307` avoids clashing with a local MySQL on 3306 |

## Useful commands

```bash
alias dc="docker compose -f digital-docker-compose.yml"

dc up -d --build          # build + start
dc up -d --build backend  # rebuild a single service
dc ps                     # status and health of the services
dc logs -f frontend       # follow a service's logs
dc exec mysql mysql -uroot -p digitalbankingdb   # MySQL shell
dc down                   # stop (data kept in the volume)
dc down -v                # stop + delete the volume (re-runs the init script)
```

## Running without Docker (development)

```bash
# 1. API on http://localhost:8085 (MySQL digitalbankingdb must be reachable)
cd backend && DB_USERNAME=<user> DB_PASSWORD=<password> mvn spring-boot:run

# 2. App on http://localhost:4200 (proxies /api to the backend via proxy.conf.json)
cd frontend && npm install && npm start
```

## Documentation

- [Backend](backend/README.md) — configuration, profiles, API endpoints
- [Frontend](frontend/README.md) — run, proxy, security choices
