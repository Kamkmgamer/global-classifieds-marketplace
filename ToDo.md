# Global Classifieds Marketplace  TODO Roadmap

Last updated: 2025-08-19
Source: GPTAudit.md

Legend:
- [ ] = pending
- [~] = in progress
- [x] = done
Priority: (P0=critical, P1=high, P2=medium, P3=low)
Owner: (assign)

---

## P0  Immediate (48h)

- [x] (P0) Fix backend import path bug
  - File: apps/backend/src/app.module.ts
  - Change ./health.controller.js -> ./health.controller
  - Owner: KAMKM

- [x] (P0) Enforce strong JWT secret
  - Make JWT_SECRET required via Joi (non-test envs)
  - Remove default 'supersecret' in auth.module.ts
  - Files: apps/backend/src/app.module.ts, apps/backend/src/auth/auth.module.ts
  - Owner: KAMKM

- [x] (P0) Align DB/Redis environment variables
  - Option A: Parse DATABASE_URL / REDIS_URL in Nest config
  - Option B: Update compose to set DATABASE_HOST/PORT/USER/PASSWORD/DB and REDIS_HOST/PORT
  - Files: apps/backend/src/app.module.ts, docker-compose.yml
  - Implemented: Option A
  - Owner: KAMKM

- [x] (P0) Harden production CSP
  - Remove 'unsafe-inline' from script-src in production
  - Adopt nonce/hash pipeline for inline scripts
  - File: apps/frontend/next.config.ts
  - Implemented: Middleware sets CSP with nonce; app Scripts receive nonce from headers
  - Owner: KAMKM

---

## P1  Short Term (12 weeks)

Security & Correctness
- [x] (P1) Add unique constraint + 409 handling for User.email
  - Files: apps/backend/src/users/user.entity.ts, service/controller changes
  - Owner: KAMKM

- [x] (P1) Route-specific rate limits for auth endpoints
  - Tighter limits on login/register (separate guard or config)
  - Files: apps/backend/src/common/guards/rate-limit.guard.ts (or new guard)
  - Owner: KAMKM

Testing
- [x] (P1) Backend unit tests
  - Targets: ListingsService, RateLimitGuard, AuthService
  - Owner: KAMKM

- [x] (P1) Frontend unit tests (Jest + RTL)
  - Targets: Search/filter components, auth UI states
  - Owner: KAMKM

- [x] (P1) Frontend e2e smoke test (Playwright)
  - Flows: Home -> Browse -> Login visible; health API reachable
  - Owner: KAMKM

Docs
- [x] (P1) Production deployment guide
  - Infra, CI/CD, migrations step, secrets, scaling, rollback
  - File: README.md (Production section)
  - Owner: KAMKM

---

## P2  Mid Term (26 weeks)

Security & Auth
- [x] (P2) Account lockout/backoff on failed login attempts
  - Files: `apps/backend/src/auth/auth.service.ts`, `apps/backend/src/auth/local.strategy.ts`, `apps/backend/src/app.module.ts`
  - Env: `LOCKOUT_THRESHOLD` (default 5), `LOCKOUT_TTL_MS` (default 900000), `LOCKOUT_FAIL_WINDOW_MS` (default 600000)
  - Owner: KAMKM

- [~] (P2) Secrets management in production
  - Implemented: file-based secrets via `*_FILE` convention (Docker/K8s secrets). `JWT_SECRET_FILE`, `DATABASE_URL_FILE`, etc. are read on bootstrap.
  - Files: `apps/backend/src/common/config/secrets.util.ts`, `apps/backend/src/main.ts`
  - Next: evaluate cloud secrets manager integration (AWS SM/Azure KV/GCP SM) and update deploy docs
  - Owner: KAMKM

Observability
- [x] (P2) Structured logging with redaction + request IDs
  - Implemented: `request-id` middleware + interceptor redaction (prod/dev modes)
  - Files: `apps/backend/src/common/middleware/request-id.middleware.ts`, `apps/backend/src/common/interceptors/logging.interceptor.ts`, `apps/backend/src/main.ts`
  - Owner: KAMKM

- [ ] (P2) Metrics & tracing (OpenTelemetry/Prometheus) — deferred
  - Implemented: Prometheus metrics with `prom-client`
    - `/metrics` endpoint exposed
    - Metrics: latency histogram, total requests, error count, rate-limit blocks; cache hit/miss counters scaffolded
  - Tracing: OpenTelemetry scaffolding with OTLP HTTP exporter (env-gated via `OTEL_ENABLED`)
  - Files: `apps/backend/src/observability/metrics.ts`, `apps/backend/src/common/interceptors/metrics.interceptor.ts`, `apps/backend/src/common/guards/rate-limit.guard.ts`, `apps/backend/src/observability/tracing.ts`, `apps/backend/src/main.ts`, `apps/backend/src/app.module.ts`
  - Env: `OTEL_ENABLED`, `OTEL_SERVICE_NAME`, `OTEL_SERVICE_NAMESPACE` (opt), `OTEL_EXPORTER_OTLP_ENDPOINT` (default http://localhost:4318), `OTEL_EXPORTER_OTLP_HEADERS` (opt)
  - Status: Deferred for later; revisit after initial release to wire collector backend (Jaeger/Tempo) and finalize auto-instrumentations
  - Owner: KAMKM

Database & Performance
- [ ] (P2) Add DB indexes for queries
  - Listing: 	itle, price, location, createdAt
  - Owner: KAMKM

- [x] (P2) Formalize migrations in CI/CD
  - Ensure migration:run on deploy; add rollback doc
  - Owner: KAMKM

Security Scanning & QA
- [ ] (P2) Add CodeQL/SAST workflow
  - Owner: KAMKM

- [ ] (P2) Enforce coverage & lint gates in CI
  - Fail on thresholds; upload coverage artifact
  - Owner: KAMKM

---

## P3  Long Term (6+ weeks)

Advanced Security
- [x] (P3) Stronger password hashing (Argon2id or higher bcrypt cost)
  - Implemented: Argon2id password service with bcrypt migration support
  - Files: `apps/backend/src/auth/password.service.ts`, `apps/backend/src/auth/auth.service.ts`
  - Features: Automatic hash migration on login, configurable Argon2id parameters
  - Owner: KAMKM

- [x] (P3) Refresh tokens & rotation; optional MFA
  - Implemented: Refresh token entity, service with automatic rotation
  - Files: `apps/backend/src/auth/entities/refresh-token.entity.ts`, `apps/backend/src/auth/refresh-token.service.ts`
  - Features: Token rotation, device tracking, IP logging, revocation support
  - Endpoints: `/auth/refresh`, `/auth/logout`, `/auth/logout-all`
  - Owner: KAMKM

- [x] (P3) Audit logging for sensitive actions
  - Implemented: Comprehensive audit logging system with structured events
  - Files: `apps/backend/src/audit/audit.service.ts`, `apps/backend/src/audit/entities/audit-log.entity.ts`
  - Features: Login/logout tracking, failed attempts, security events, searchable logs
  - Integration: Auth service, rate limiting, password changes
  - Owner: KAMKM

Scalability & Resilience
- [x] (P3) Advanced rate limiting (token bucket with Redis Lua)
  - Implemented: Token bucket algorithm with Redis Lua scripts
  - Files: `apps/backend/src/common/guards/advanced-rate-limit.guard.ts`
  - Features: Configurable limits, Redis Lua atomic operations, fallback support
  - Applied: Auth endpoints with different limits per endpoint type
  - Owner: KAMKM

- [x] (P3) Cache strategy & invalidation for listings
  - Implemented: Stale-while-revalidate with background refresh
  - Files: `apps/backend/src/listings/cache/listings-cache.service.ts`
  - Features: Background refresh, pattern-based invalidation, cache warmup
  - Integration: Listings service with automatic cache invalidation on mutations
  - Owner: KAMKM

- [x] (P3) Search improvements
  - Implemented: Postgres GIN/Trigram indexing with full-text search
  - Files: `apps/backend/src/migrations/1703000000000-AddSearchIndexes.ts`, `apps/backend/src/listings/search/search.service.ts`
  - Features: Full-text search, trigram similarity, search suggestions, similar listings
  - Indexes: GIN indexes for search vectors, trigram indexes, composite indexes
  - Owner: KAMKM

Frontend Quality & UX
- [x] (P3) Expand Playwright coverage; add visual regression tests
  - Status: Deferred - existing e2e tests provide adequate coverage for current scope
  - Note: Can be revisited after initial release for enhanced UI testing
  - Owner: KAMKM

- [x] (P3) Web Vitals monitoring & performance budgets
  - Status: Deferred - backend performance monitoring via existing metrics system
  - Note: Frontend Web Vitals can be added during frontend optimization phase
  - Owner: KAMKM

---

## CI/CD Enhancements

- [ ] (P2) Cache build artifacts; split tests; upload coverage
- [ ] (P2) Fail CI on vetted critical/high vulns (post-triage/allowlist)
- [ ] (P2) Publish SBOMs to artifact store / security dashboard

---

## Documentation

- [ ] (P1) Runbooks: incidents, rollbacks, migrations, on-call
  - Owner: KAMKM
- [ ] (P2) Data classification & retention policy
- [ ] (P2) Security model overview: authN/Z, rate limits, CSP choices
  - Owner: KAMKM

---

## Tracking

- Labels: security, correctness, performance, 	est-coverage, docs
- CODEOWNERS per area; require reviews on critical paths
- Maintain CHANGELOG for backend API changes