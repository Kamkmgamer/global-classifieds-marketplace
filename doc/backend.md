# Backend Documentation (NestJS)

This backend is a NestJS 11 app using TypeORM (PostgreSQL), Redis cache, Passport (JWT + Local), validation, rate limiting, and observability (Prometheus + OpenTelemetry).

- Entry: `apps/backend/src/main.ts`
- Root module: `apps/backend/src/app.module.ts`
- Entities: `User`, `Listing`
- Modules: `AuthModule`, `UsersModule`, `ListingsModule`
- Observability: `apps/backend/src/observability/*`

## Tech Stack
- Language: TypeScript
- Framework: NestJS 11 (`@nestjs/*`)
- ORM: TypeORM 0.3.x
- DB: PostgreSQL 16
- Cache: Redis
- Auth: Passport Local + JWT
- Validation: `class-validator` + `class-transformer`
- Security: `helmet`, CORS
- Metrics: `prom-client` exposed at `/metrics`
- Tracing: OpenTelemetry Node SDK (optional via env)

## Configuration
- Centralized via `ConfigModule` in `app.module.ts` with Joi validation.
- Key envs (see `.env.development` and validation in `app.module.ts`):
  - Database: `DATABASE_URL` or `DATABASE_HOST/PORT/POSTGRES_*`
  - Redis: `REDIS_URL` or `REDIS_HOST/REDIS_PORT`
  - Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`
  - TypeORM: `TYPEORM_SYNCHRONIZE` (dev only)
  - CORS: `CORS_ORIGINS`
  - OTEL: `OTEL_ENABLED`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`
  - Rate limit: `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW_MS`
- File-based secrets supported via `apps/backend/src/common/config/secrets.util.ts` and applied in `main.ts`.

## Server Bootstrap
See `apps/backend/src/main.ts`:
- Applies CORS based on `CORS_ORIGINS`.
- Global exception filter `AllExceptionsFilter` (`apps/backend/src/common/filters/all-exceptions.filter.ts`).
- Global interceptors: `MetricsInterceptor` then `LoggingInterceptor`.
- `helmet` security headers.
- `ValidationPipe` with whitelist/transform.
- Registers `GET /metrics` using `metricsHandler`.
- Swagger at `/docs` when not production or `SWAGGER_ENABLED=true`.

## Authentication
- Local login flow via `LocalStrategy` (`apps/backend/src/auth/local.strategy.ts`) and `LocalAuthGuard`.
- JWT strategy (`apps/backend/src/auth/jwt.strategy.ts`) extracts bearer token and adds `{ userId, email, roles }` to request.
- Tokens signed by `JwtModule.registerAsync` using `JWT_SECRET`.
- Account lockout/backoff implemented in `AuthService` using Redis (`cache-manager`): keys `auth:fail:*`, `auth:lock:*`.

### Auth Endpoints (`apps/backend/src/auth/auth.controller.ts`)
- POST `/auth/register`
  - Body: `{ email: string; password: string }`
  - 201 Created → `{ id, email, role, createdAt, updatedAt }`
  - 409 Conflict on duplicate email
- POST `/auth/login`
  - Guarded by `LocalAuthGuard`
  - Body: `{ email: string; password: string }`
  - 200 OK → `{ access_token: string }`
  - 401 Unauthorized on invalid credentials; 429 if account locked

Example:
```http
POST /auth/register HTTP/1.1
Content-Type: application/json

{ "email": "user@example.com", "password": "Passw0rd!" }
```
```http
POST /auth/login HTTP/1.1
Content-Type: application/json

{ "email": "user@example.com", "password": "Passw0rd!" }
```

## Listings
- Entity: `apps/backend/src/listings/listing.entity.ts`
  - `id (uuid)`, `title (string)`, `price (int)`, `image?`, `location?`, `description?`, `createdAt`, `updatedAt`
- Controller: `apps/backend/src/listings/listings.controller.ts`
  - GET `/listings` with query: `limit`, `page`, `q`, `minPrice`, `maxPrice`, `location`, `sort`
  - POST `/listings` requires `JwtAuthGuard` + `RolesGuard` and `@Roles('admin')`
- Service: `apps/backend/src/listings/listings.service.ts` (filters, pagination, sorting)

Example:
```http
GET /listings?q=phone&minPrice=100&maxPrice=500&page=1&limit=20&sort=price:asc
```
```http
POST /listings
Authorization: Bearer <JWT>
Content-Type: application/json

{ "title": "iPhone 13", "price": 450, "location": "NY" }
```

## Users
- Entity: `apps/backend/src/users/user.entity.ts`
  - `id (uuid)`, `email (unique)`, `password (excluded from serialization)`, `role`, timestamps
- `UsersService` provides `findByEmail`, `create`.

## Guards, Filters, Interceptors, Middleware
- `RateLimitGuard` (`apps/backend/src/common/guards/rate-limit.guard.ts`): fixed-window rate limiting with Redis. Bypasses `/docs`, `/health`, `/metrics`.
- `RolesGuard` (`apps/backend/src/common/guards/roles.guard.ts`): enforces `@Roles()` decorator.
- `AllExceptionsFilter` (`apps/backend/src/common/filters/all-exceptions.filter.ts`): formats errors; increments metrics via `httpErrorsTotal`.
- `LoggingInterceptor` (`apps/backend/src/common/interceptors/logging.interceptor.ts`): request logging with durations.
- `MetricsInterceptor` (`apps/backend/src/common/interceptors/metrics.interceptor.ts`): records `http_request_duration_seconds` and `http_requests_total`.
- `requestIdMiddleware` (`apps/backend/src/common/middleware/request-id.middleware.ts`): attaches `x-request-id`.

## Metrics and Tracing
- Prometheus metrics defined in `apps/backend/src/observability/metrics.ts`:
  - `http_request_duration_seconds` (Histogram)
  - `http_requests_total` (Counter)
  - `http_errors_total` (Counter)
  - `rate_limit_block_total` (Counter)
  - `cache_hit_total`, `cache_miss_total`
- Metrics exposed at `GET /metrics` and scraped by Prometheus (see `ops/prometheus.yml`).
- Tracing (optional) in `apps/backend/src/observability/tracing.ts`, enabled when `OTEL_ENABLED=true`. Exports OTLP HTTP to `OTEL_EXPORTER_OTLP_ENDPOINT`.

## Database Access
- Configured in `app.module.ts` via `TypeOrmModule.forRootAsync` with env fallbacks and `entities: [Listing, User]`.
- Migrations via `ormconfig.ts`/`AppDataSource` and `package.json` scripts: `migration:generate`, `migration:run`, etc.
- Synchronize is disabled by default and only allowed in non-production when `TYPEORM_SYNCHRONIZE=true`.

## Error Handling
- Global filter converts exceptions to consistent JSON and increments `http_errors_total`.
- 400 validation errors via `ValidationPipe`.
- 401/403 for auth/roles.
- 429 for rate limiting or account lockouts.

## Swagger
- Available at `/docs` outside production or when `SWAGGER_ENABLED=true`.
- JWT bearer auth enabled in the doc.

## Deployment
- Dockerfile builds with pnpm and runs `node apps/backend/dist/src/main.js`.
- Ports: 5000 (API), 9229 (debug via compose).
- Compose dependencies: Postgres (`db`), Redis (`redis`), Prometheus, Grafana.
- Staging compose uses images via `BACKEND_IMAGE`/`FRONTEND_IMAGE` if provided.

## Security Considerations
- Ensure strong `JWT_SECRET` in non-test environments.
- Disable `TYPEORM_SYNCHRONIZE` in production and use migrations.
- Restrict `CORS_ORIGINS` appropriately.
- Prefer HttpOnly, Secure cookies for session tokens if moving away from pure bearer in SPA.
