# Architecture

This monorepo contains a typed full‑stack web application with a NestJS backend and a Next.js frontend. Persistence is handled by PostgreSQL via TypeORM, with Redis for caching/rate limiting. Observability is provided by Prometheus metrics and optional OpenTelemetry traces.

- Monorepo root: `global-classifieds-marketplace`
- Backend: `apps/backend` (NestJS)
- Frontend: `apps/frontend` (Next.js App Router)
- Ops: `ops/` (Prometheus and OTEL collector configs)

## High-Level Diagram (Mermaid)
```mermaid
flowchart LR
  subgraph Client
    Browser[User Browser]
  end

  subgraph Frontend[Next.js (apps/frontend)]
    NextServer[Next Standalone Server]
    NextAPI[/Next API routes /api/*/]
  end

  subgraph Backend[NestJS API (apps/backend)]
    Nest[HTTP Server]
    Metrics[/GET /metrics/]
  end

  subgraph Data[Data Services]
    PG[(PostgreSQL)]
    Redis[(Redis Cache)]
  end

  subgraph Observability[Observability]
    Prometheus[Prometheus]
    Grafana[Grafana]
    OTEL[OTEL Collector (optional)]
  end

  Browser -->|HTTP:3000| NextServer
  NextServer -->|/api/* proxy| NextAPI
  NextAPI -->|HTTP| Nest
  Nest -->|TypeORM| PG
  Nest -->|cache-manager| Redis
  Nest -->|/metrics| Metrics --> Prometheus --> Grafana
  Nest -. optional traces .-> OTEL
```

## Request Flow
1. Browser sends requests to Next.js (port 3000).
2. Client-side code uses `src/lib/http.ts`, which on the browser prefixes requests with `/api`.
3. Next API routes can proxy to the backend using `env.NEXT_PUBLIC_BACKEND_URL` on the server.
4. Backend handles requests via Nest controllers/services, with validation, guards, and interceptors.
5. Persistence through TypeORM to Postgres; caching/rate limits via Redis.
6. Metrics exposed at `/metrics` scraped by Prometheus and visualized in Grafana.
7. Optional OTEL traces exported via HTTP to a collector.

## Backend Architecture Notes
- Root module `AppModule` wires modules, TypeORM connection, Redis cache, and configuration.
- Global `RateLimitGuard` throttles requests and returns 429 when exceeded.
- Auth uses Local strategy for login and JWT for protected routes.
- `MetricsInterceptor` and `LoggingInterceptor` provide timing and logs; `AllExceptionsFilter` unifies error responses.

## Deployment Topology
- Local dev: `docker-compose.yml` launches frontend, backend, Postgres, Redis, Prometheus, Grafana.
- Staging: `docker-compose.staging.yml` supports prebuilt images and avoids exposing DB/Redis ports publicly.
- Dockerfiles build standalone images with pnpm for both apps.

### Ports
- Frontend: 3000
- Backend: 5000 (9229 debug)
- Postgres: 5432 (dev exposed, staging not exposed by default)
- Redis: 6379 (dev exposed, staging not exposed by default)
- Prometheus: 9090
- Grafana: 3001

## Diagrams to Add (Manual)
- Detailed sequence diagram for login and token issuance.
- ERD with future `User`↔`Listing` relation.

## Key Design Decisions
- Use Redis-backed rate limiting and auth lockout to mitigate brute-force attempts.
- Disable TypeORM synchronize in production; rely on migrations.
- Expose Prometheus metrics for SRE dashboards; optional OTEL for trace correlation.
- Next.js API as a proxy boundary to avoid exposing backend hostnames to the client.

## Risks and Future Improvements
- Session handling currently uses localStorage in the demo; prefer HttpOnly cookies in production.
- Add ownership relation between `Listing` and `User` and enforce RBAC for listing management.
- Implement full CRUD for listings and user profiles.
- Harden CORS and CSP as deployment environments dictate.
