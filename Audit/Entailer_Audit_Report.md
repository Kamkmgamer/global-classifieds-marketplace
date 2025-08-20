# Entailer Audit Report

Date: 2025-08-20
Repository: `Kamkmgamer/global-classifieds-marketplace`
Scope: Full-stack monorepo (NestJS backend, Next.js frontend), Docker, CI/CD, observability

---

## Executive Summary

* __Strengths__
  - __Modern tooling and structure__: pnpm workspaces (`package.json`, `pnpm-workspace.yaml`), clear apps split (`apps/backend/`, `apps/frontend/`).
  - __Backend hardening__: Global validation, Helmet, centralized exception handling and logging, Prometheus metrics and OpenTelemetry tracing in `apps/backend/src/main.ts`, rate limiting in `apps/backend/src/common/guards/rate-limit.guard.ts`.
  - __CI quality gates__: Typecheck, lint, test, build, SBOM generation, secret and vuln scans in `.github/workflows/ci.yml`.
  - __Docs__: Extensive `README.md` with setup, migrations, deployment and troubleshooting. Clear Docker Compose for local dev (`docker-compose.yml`).

* __Notable Risks / Gaps__
  - __Frontend auth handling__: `apps/frontend/src/app/login/page.tsx` stores JWT in `localStorage` and sets a non-HttpOnly `session` cookie. This is vulnerable to XSS token theft and CSRF-related issues.
  - __Backend TypeScript strictness__: `apps/backend/tsconfig.json` lacks full `strict: true`; `noImplicitAny` is disabled. May hide type bugs.
  - __Testing__: Sparse evidence of backend unit/e2e tests and limited frontend tests (only a couple in `apps/frontend/src/components/__tests__/`). Coverage likely low.
  - __Security posture in Compose__: `docker-compose.yml` exposes Postgres (`5432`) and Redis (`6379`) on the host and uses weak/placeholder creds. Suitable for dev only; ensure isolation in staging/prod.
  - __Staging workflow migrations__: `.github/workflows/staging.yml` warns that migrations cannot run from the production image due to missing dev deps. Risk of drift if not executed elsewhere.

Overall, the project shows solid foundations with enterprise-grade patterns (observability, security headers, CI gates). The most pressing fix is auth/session handling and increasing test coverage.

---

## Code Quality

* __Structure & Modularity__
  - Clear monorepo layout (`apps/backend/`, `apps/frontend/`). Backend shows conventional NestJS layering (modules/interceptors/guards in `apps/backend/src/common/...`).
* __Readability & Conventions__
  - Consistent formatting via Prettier. ESLint configured (frontend `apps/frontend/eslint.config.mjs`; backend eslint referenced in `apps/backend/package.json`).
  - Good naming and comments in `main.ts`, `metrics.interceptor.ts`, and `rate-limit.guard.ts`.
* __Type Safety__
  - Frontend `apps/frontend/tsconfig.json` has `strict: true`.
  - Backend `apps/backend/tsconfig.json` misses `strict: true` and sets `noImplicitAny: false`. Recommend enabling strict mode project-wide.
* __Reusability__
  - Observability utilities referenced (`apps/backend/src/observability/*`, e.g., `metrics`, `tracing`) promote reuse. Good use of a global interceptor for metrics `MetricsInterceptor` and a global exception filter (`AllExceptionsFilter`).

---

## Architecture & Design

* __Backend (NestJS)__
  - __Bootstrapping__: `apps/backend/src/main.ts` applies `applyFileBasedSecrets()`, CORS, global filters/interceptors, validation, metrics endpoint, Swagger in non-prod.
  - __Security headers__: `helmet` configured with COOP/CORP and safe referrer policy; Content Security Policy is off at backend to defer to frontend CSP.
  - __Observability__: Prometheus metrics (`metricsHandler`, `httpRequestDuration`, `httpRequestsTotal`, `httpErrorsTotal`) and OpenTelemetry (`initTracing`, `shutdownTracing`). Strong practice for production readiness.
  - __Rate limiting__: `RateLimitGuard` with per-route windows and Redis-backed cache (via `cache-manager` and `cache-manager-redis-store` dependency in `apps/backend/package.json`). Skips `/docs`, `/health`, `/metrics`. Good defaults and headers.
  - __Data layer__: TypeORM + Postgres with migrations workflow described in `README.md`. Production guidance to keep `synchronize` off is called out.

* __Frontend (Next.js)__
  - __Modern stack__: Next 15, React 19, Tailwind and Shadcn. Linting via `next/core-web-vitals`.
  - __Auth flow__: `apps/frontend/src/app/login/page.tsx` and `apps/frontend/src/app/register/page.tsx` call backend via `api` client. Current token storage is a security risk (see Security section).

* __Dev/Infra__
  - __Docker Compose__: Multi-service dev env in `docker-compose.yml` with hot reload. Environment variables captured in `.env.development`. Staging/prod compose in `docker-compose.staging.yml` referenced in docs and staging workflow.
  - __CI/CD__: CI covers typecheck/lint/test/build; staging workflow builds and pushes images to GHCR and deploys via SSH with compose, with a post-deploy smoke check.

__Scalability__: Stateless backend patterns, Redis cache, and metrics/tracing provide a good path to horizontal scale. Recommend extracting config, secrets, and connection pools per environment and adding a reverse proxy for TLS and routing.

---

## Security Review

* __Secrets & Config__
  - `.env.development` contains placeholders — fine for dev. `.env.production` is empty (good to avoid committing secrets). `applyFileBasedSecrets()` suggests Docker/K8s secret-file support.
* __Authentication & Session Handling__
  - Frontend stores JWT in `localStorage` and sets a non-HttpOnly `session` cookie (`apps/frontend/src/app/login/page.tsx`). This exposes tokens to XSS and invites CSRF if cookies are later used.
    - Recommendation: Make backend issue an HttpOnly, Secure, SameSite cookie for the access/refresh token pair. Remove localStorage token usage. Use CSRF protection if SameSite=None.
* __CORS__
  - CORS origins are env-driven; defaults to permissive in dev in `apps/backend/src/main.ts`. Ensure production environment sets strict origins.
* __Headers & Hardening__
  - Helmet enabled with sensible options; CSP disabled server-side — ensure frontend sets a strict CSP.
* __Rate Limiting__
  - Present and differentiates auth vs general routes. Ensure `CACHE_MANAGER` is backed by Redis in production, not memory.
* __Dependencies__
  - CI performs `pnpm audit` and Trivy scans. Modern dependency versions used (NestJS 11, React 19, Next 15). Keep regular updates via `renovate.json` already present.
* __Network & Infra__
  - `docker-compose.yml` exposes Postgres and Redis to host. For staging/prod, do not expose these ports publicly; use internal networks only and strong credentials.

---

## Documentation & Comments

* __Project Docs__: `README.md` is thorough: setup, scripts, migrations, deployment, troubleshooting, scaling, security checklist.
* __Inline Docs__: Key backend pieces have helpful comments (`main.ts`, `metrics.interceptor.ts`, `rate-limit.guard.ts`).
* __Gaps__: No explicit ADRs or high-level architecture diagram. Consider adding `docs/` with system overview, request flow, and threat model.

---

## Testing

* __Frontend__: Jest + Testing Library configured (`apps/frontend/jest.config.ts`, `tsconfig.jest.json`). A small number of tests in `apps/frontend/src/components/__tests__/`. E2E via Playwright is configured in scripts, but no tests were observed in repo snapshot.
* __Backend__: Jest configuration in `apps/backend/package.json` with `test`, `test:cov`, `test:e2e`. However, no backend `*.spec.ts` files were surfaced in this snapshot. E2E tests are referenced in `README.md` but not present here.
* __Coverage__: Likely low. CI calls `pnpm -w test`, but no coverage thresholds enforced or reports uploaded.

__Recommendations__
- Add backend unit tests for services/controllers and e2e tests for auth, listings, and rate limiting. Enable `test:cov` and enforce min coverage.
- Expand frontend tests for pages and critical components; add accessibility checks.
- Integrate Playwright e2e smoke for auth + happy-path browsing in CI (behind a tag or nightly workflow).

---

## Tooling & Workflows

* __Lint/Format__: Workspace-wide scripts in root `package.json`. Frontend ESLint flat config present. Backend uses ESLint via scripts. Prettier configured.
* __CI__: `.github/workflows/ci.yml` includes typecheck, lint, test, build, audit, SBOM, secret scan and Trivy. Strong baseline.
* __Staging Deploy__: `.github/workflows/staging.yml` builds/pushes GHCR images and deploys via SSH with compose and a smoke check. It warns about migrations — ensure migrations run in CI before deploy.
* __Observability__: OpenTelemetry collector example in `ops/otel-collector-config.yaml`. Backend exposes `/metrics` and wires tracing.

__Improvements__
- Cache build artifacts to speed CI, upload test results and coverage. Add a `lint:strict` step for backend.
- Add a nightly dependency update and vulnerability scan job; Renovate config is present.
- Add Docker image scanning for the built images (Trivy image mode) and push signed images (Sigstore/Cosign) in staging/prod.

---

## Overall Rating

__Score: 7.5 / 10__

__Justification__
- Strong architecture patterns, observability, CI checks, and documentation.
- Key security gap in auth token handling on the frontend and missing strict TS in backend.
- Testing coverage appears limited; migrations execution path in staging is not fully automated.

---

## Recommended Next Steps

### Short-term (1–2 weeks)
- __Fix auth/session security__
  - Backend: Issue HttpOnly, Secure cookies for access/refresh tokens; add `/auth/refresh` and rotation. Set proper `SameSite` and CORS with `credentials: true`.
  - Frontend: Remove `localStorage` token storage and client-set cookies in `apps/frontend/src/app/login/page.tsx`. Use `fetch` with `credentials: 'include'`.
- __Tighten backend TypeScript__
  - Set `"strict": true` and `"noImplicitAny": true` in `apps/backend/tsconfig.json`; fix resulting type issues.
- __Harden dev docker compose__
  - Remove host port exposure for DB/Redis (or guard with comments); use strong non-default creds even in dev, or explicitly scope to dev only.
- __Add minimal tests__
  - Backend: unit tests for auth service, listing service; e2e for login/register and protected route.
  - Frontend: tests for login/register forms and core UI components; add Playwright smoke.
- __CSP & security headers__
  - Define a production CSP in the frontend and document it. Keep backend CSP off to avoid conflicts.

### Mid-term (3–6 weeks)
- __Observability roll-out__
  - Deploy an OTEL collector (e.g., Jaeger/Tempo) and Prometheus + Grafana stack; add alerts.
- __CI enhancements__
  - Enforce coverage thresholds, upload coverage to a dashboard. Add Trivy image scan for built images. Add SBOM attestation.
- __Docs__
  - Add ADRs and an architecture diagram in `docs/`. Add a threat model and incident runbook.
- __Migrations workflow__
  - Introduce a dedicated pipeline step to run `migration:run` using a Node environment with dev deps before deploy. Alternatively, provide a small migration image.

### Long-term (6+ weeks)
- __Auth modernization__
  - Consider moving to a session management pattern with short-lived access token + refresh token rotation, device-bound sessions, and optional WebAuthn for 2FA.
- __Performance & scale__
  - Add caching layers for hot queries, background job queue for heavy tasks, and CDN for assets. Evaluate horizontal sharding strategies if listings volume grows.
- __Testing maturity__
  - Introduce contract tests (e.g., Pact) between frontend and backend; add load testing (k6) for critical endpoints.
- __Security posture__
  - Regular security reviews, dependency pinning, SAST/DAST integration, and periodic secrets rotation.

---

## Appendix: Key References in Repo

- Root: `package.json`, `pnpm-workspace.yaml`, `.env.development`, `.env.production`
- Backend: `apps/backend/src/main.ts`, `apps/backend/src/common/guards/rate-limit.guard.ts`, `apps/backend/src/common/interceptors/metrics.interceptor.ts`, `apps/backend/tsconfig.json`, `apps/backend/package.json`
- Frontend: `apps/frontend/src/app/login/page.tsx`, `apps/frontend/src/app/register/page.tsx`, `apps/frontend/jest.config.ts`, `apps/frontend/eslint.config.mjs`, `apps/frontend/tsconfig.json`
- CI/CD: `.github/workflows/ci.yml`, `.github/workflows/staging.yml`
- Ops: `ops/otel-collector-config.yaml`
- Docker: `docker-compose.yml`, `docker-compose.staging.yml`
