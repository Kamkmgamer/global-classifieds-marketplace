# Global Classifieds Marketplace – Documentation Index

This documentation provides a comprehensive overview of the project, covering backend, frontend, database, and architecture.

- Project: `global-classifieds-marketplace`
- Monorepo: `apps/backend` (NestJS) and `apps/frontend` (Next.js)
- Package manager: pnpm

## Table of Contents
- [Overview](#overview)
- [Architecture](architecture.md)
- [Backend](backend.md)
- [Database](database.md)
- [Frontend](frontend.md)
- [How to Run](#how-to-run)
- [Testing Strategy](#testing-strategy)
- [Contribution Guidelines](#contribution-guidelines)
- [Known Gaps / Next Steps](#known-gaps--next-steps)

## Overview
The Global Classifieds Marketplace is a full‑stack monorepo with:
- Backend API built with NestJS 11, TypeORM 0.3.x, Postgres 16, Redis cache, JWT auth, Prometheus metrics, and OpenTelemetry tracing.
- Frontend app built with Next.js 15 (App Router), React 19, TailwindCSS, Radix UI primitives, and a typed HTTP client.
- Docker Compose for local development and staging, plus Prometheus and Grafana.

Key goals:
- Provide a secure, observable, and scalable marketplace API and UI.
- Demonstrate robust auth, validation, rate limiting, and metrics.

## How to Run
- Development (Compose):
  - `docker-compose up --build`
  - Services: frontend (http://localhost:3000), backend (http://localhost:5000), Postgres (5432), Redis (6379), Prometheus (9090), Grafana (3001)
- Staging-like setup: `docker-compose -f docker-compose.staging.yml up --build`

See `docker-compose.yml`, `docker-compose.staging.yml`, `apps/backend/Dockerfile`, and `apps/frontend/Dockerfile`.

## Testing Strategy
- Backend: Jest unit tests and e2e config available. See `apps/backend/package.json` scripts and `apps/backend/src/**/*.spec.ts`.
- Frontend: Jest + Testing Library for unit; Playwright for e2e. See `apps/frontend/package.json` (scripts: `test`, `e2e`).

## Contribution Guidelines
- Conventional formatting via Prettier and ESLint in both apps.
- Type checking with TypeScript; run `pnpm -r run typecheck`.
- Linting: `pnpm -r run lint`.
- Prefer adding tests for new features.

## Known Gaps / Next Steps
- No explicit relation between `Listing` and `User` yet.
- Session management currently relies on bearer tokens (frontend stores a token for demo). Consider HttpOnly cookies.
- Add production migration workflow and CI gates.
- Expand API surface for listings CRUD and user profile management.
