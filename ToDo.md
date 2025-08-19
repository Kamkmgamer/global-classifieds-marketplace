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
  - Owner:

- [x] (P0) Enforce strong JWT secret
  - Make JWT_SECRET required via Joi (non-test envs)
  - Remove default 'supersecret' in auth.module.ts
  - Files: apps/backend/src/app.module.ts, apps/backend/src/auth/auth.module.ts
  - Owner:

- [x] (P0) Align DB/Redis environment variables
  - Option A: Parse DATABASE_URL / REDIS_URL in Nest config
  - Option B: Update compose to set DATABASE_HOST/PORT/USER/PASSWORD/DB and REDIS_HOST/PORT
  - Files: apps/backend/src/app.module.ts, docker-compose.yml
  - Implemented: Option A
  - Owner:

- [x] (P0) Harden production CSP
  - Remove 'unsafe-inline' from script-src in production
  - Adopt nonce/hash pipeline for inline scripts
  - File: apps/frontend/next.config.ts
  - Implemented: Middleware sets CSP with nonce; app Scripts receive nonce from headers
  - Owner:

---

## P1  Short Term (12 weeks)

Security & Correctness
- [ ] (P1) Add unique constraint + 409 handling for User.email
  - Files: apps/backend/src/users/user.entity.ts, service/controller changes
  - Owner:

- [ ] (P1) Route-specific rate limits for auth endpoints
  - Tighter limits on login/register (separate guard or config)
  - Files: apps/backend/src/common/guards/rate-limit.guard.ts (or new guard)
  - Owner:

Testing
- [ ] (P1) Backend unit tests
  - Targets: ListingsService, RateLimitGuard, AuthService
  - Owner:

- [ ] (P1) Frontend unit tests (Jest + RTL)
  - Targets: Search/filter components, auth UI states
  - Owner:

- [ ] (P1) Frontend e2e smoke test (Playwright)
  - Flows: Home -> Browse -> Login visible; health API reachable
  - Owner:

Docs
- [ ] (P1) Production deployment guide
  - Infra, CI/CD, migrations step, secrets, scaling, rollback
  - File: README.md (Production section)
  - Owner:

---

## P2  Mid Term (26 weeks)

Security & Auth
- [ ] (P2) Account lockout/backoff on failed login attempts
  - Owner:

- [ ] (P2) Secrets management in production
  - Cloud secrets manager; remove plaintext secrets from env
  - Owner:

Observability
- [ ] (P2) Structured logging with redaction + request IDs
  - Centralize logger; verify redaction; correlation IDs end-to-end
  - Owner:

- [ ] (P2) Metrics & tracing (OpenTelemetry/Prometheus)
  - Metrics: latency, error rate, rate-limit hits, cache hit ratio
  - Owner:

Database & Performance
- [ ] (P2) Add DB indexes for queries
  - Listing: 	itle, price, location, createdAt
  - Owner:

- [ ] (P2) Formalize migrations in CI/CD
  - Ensure migration:run on deploy; add rollback doc
  - Owner:

Security Scanning & QA
- [ ] (P2) Add CodeQL/SAST workflow
  - Owner:

- [ ] (P2) Enforce coverage & lint gates in CI
  - Fail on thresholds; upload coverage artifact
  - Owner:

---

## P3  Long Term (6+ weeks)

Advanced Security
- [ ] (P3) Stronger password hashing (Argon2id or higher bcrypt cost)
  - Owner:

- [ ] (P3) Refresh tokens & rotation; optional MFA
  - Owner:

- [ ] (P3) Audit logging for sensitive actions
  - Owner:

Scalability & Resilience
- [ ] (P3) Advanced rate limiting (token bucket with Redis Lua)
  - Owner:

- [ ] (P3) Cache strategy & invalidation for listings
  - Stale-while-revalidate, warmups
  - Owner:

- [ ] (P3) Search improvements
  - Postgres GIN/Trigram or an external search service
  - Owner:

Frontend Quality & UX
- [ ] (P3) Expand Playwright coverage; add visual regression tests
  - Owner:

- [ ] (P3) Web Vitals monitoring & performance budgets
  - Owner:

---

## CI/CD Enhancements

- [ ] (P2) Cache build artifacts; split tests; upload coverage
- [ ] (P2) Fail CI on vetted critical/high vulns (post-triage/allowlist)
- [ ] (P2) Publish SBOMs to artifact store / security dashboard

---

## Documentation

- [ ] (P1) Runbooks: incidents, rollbacks, migrations, on-call
- [ ] (P2) Data classification & retention policy
- [ ] (P2) Security model overview: authN/Z, rate limits, CSP choices

---

## Tracking

- Labels: security, correctness, performance, 	est-coverage, docs
- CODEOWNERS per area; require reviews on critical paths
- Maintain CHANGELOG for backend API changes