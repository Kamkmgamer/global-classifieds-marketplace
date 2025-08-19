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

- [ ] (P2) Secrets management in production
  - Cloud secrets manager; remove plaintext secrets from env
  - Owner: KAMKM

Observability
- [ ] (P2) Structured logging with redaction + request IDs
  - Centralize logger; verify redaction; correlation IDs end-to-end
  - Owner: KAMKM

- [ ] (P2) Metrics & tracing (OpenTelemetry/Prometheus)
  - Metrics: latency, error rate, rate-limit hits, cache hit ratio
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
- [ ] (P3) Stronger password hashing (Argon2id or higher bcrypt cost)
  - Owner: KAMKM

- [ ] (P3) Refresh tokens & rotation; optional MFA
  - Owner: KAMKM

- [ ] (P3) Audit logging for sensitive actions
  - Owner: KAMKM

Scalability & Resilience
- [ ] (P3) Advanced rate limiting (token bucket with Redis Lua)
  - Owner: KAMKM

- [ ] (P3) Cache strategy & invalidation for listings
  - Stale-while-revalidate, warmups
  - Owner: KAMKM

- [ ] (P3) Search improvements
  - Postgres GIN/Trigram or an external search service
  - Owner: KAMKM

Frontend Quality & UX
- [ ] (P3) Expand Playwright coverage; add visual regression tests
  - Owner: KAMKM

- [ ] (P3) Web Vitals monitoring & performance budgets
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