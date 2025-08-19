# Global Classifieds Marketplace (Monorepo)

An enterprise-grade classifieds marketplace application built with a modern monorepo architecture, featuring a robust NestJS backend and a high-performance Next.js frontend. Designed for scalability, security, and an exceptional user experience.

---

## Key Features & Enhancements

This project has been elevated to an enterprise-grade standard with the following key features:

### Backend (NestJS, TypeScript, TypeORM, PostgreSQL, Redis)
- **Robust API:** Built with NestJS, providing a modular, scalable, and maintainable backend.
- **Database Integration:** Persistent data storage using PostgreSQL with TypeORM for efficient and type-safe database interactions.
- **Authentication & Authorization:** Secure JWT-based authentication system with user registration, login, and role-based access control (RBAC) for protected endpoints.
- **Centralized Error Handling:** Global exception filters for consistent and informative error responses.
- **Security Headers:** Helmet middleware enables COOP/CORP, Referrer Policy and other best-practice headers by default (frontend enforces CSP).
- **Privacy‑First Logging:** Global logging interceptor with sensitive‑data redaction. In production, logs omit full bodies/responses and keep concise request/response lines.
- **Performance Optimization:** Integrated Redis caching for frequently accessed data (e.g., listings) to reduce database load and improve response times.
- **Data Validation:** Strict input validation using DTOs and validation pipes for all API requests.

### Frontend (Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI)
- **Modern UI/UX:** Clean, consistent, and visually appealing design system built with Tailwind CSS and Shadcn UI components.
- **Dark/Light Mode Excellence:** Seamless and WCAG-accessible dark and light themes.
- **Intuitive User Flows:** Optimized registration, login, and listing creation processes.
- **Enhanced User Feedback:** Implemented loading skeletons and clear empty states for a smoother user experience.
- **Responsive Design:** Fully responsive and touch-friendly UI across all screen sizes.
- **Authentication Integration:** Seamless integration with the backend authentication system, managing user sessions and protecting client-side routes.
- **Dev‑Only Accessibility Audits:** `@axe-core/react` runs automatically in development to flag common a11y issues without impacting production builds.

---

## Technology Stack

- **Monorepo Tool:** pnpm workspaces
- **Backend:**
    - **Framework:** NestJS
    - **Language:** TypeScript
    - **Database:** PostgreSQL
    - **ORM:** TypeORM
    - **Caching:** Redis (via `cache-manager-redis-store`)
    - **Authentication:** Passport.js, JWT, bcrypt
    - **Validation:** class-validator
- **Frontend:**
    - **Framework:** Next.js 15 (App Router)
    - **Language:** TypeScript
    - **Styling:** Tailwind CSS
    - **UI Components:** Shadcn UI
    - **State Management:** React Context (for authentication)

---

## Prerequisites

- Node.js 20.x LTS (recommended)
- pnpm 9.x or later
- Docker & Docker Compose (for local development environment with PostgreSQL and Redis)
- Git

Check versions:

```bash
node -v
pnpm -v
docker -v
docker compose version
```

---

## Quick Start (Local Development)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Kamkmgamer/global-classifieds-marketplace.git
    cd global-classifieds-marketplace
    ```

2.  **Install pnpm dependencies:**
    ```bash
    pnpm install
    ```
    *If prompted by pnpm to approve build scripts (e.g., for `@nestjs/core`, `sharp`), select them all and press Enter.*

3.  **Set up environment variables:**
    - Create `apps/backend/.env` with the following content (or adjust as needed):
        ```
        # apps/backend/.env
        PORT=5000
        DATABASE_URL=postgresql://user:password@db:5432/classifieds_db
        REDIS_URL=redis://redis:6379
        JWT_SECRET=your_super_secret_jwt_key_here # **CHANGE THIS IN PRODUCTION**
        ```
    - Create `apps/frontend/.env.local` with the following content:
        ```
        # apps/frontend/.env.local
        NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
        NEXT_PUBLIC_SITE_URL=http://localhost:3000
        ```

4.  **Start the development environment with Docker Compose:**
    This will spin up PostgreSQL, Redis, the NestJS backend, and the Next.js frontend.
    ```bash
    docker compose up --build
    ```
    *Ensure Docker Desktop is running if you are on Windows/macOS.*

5.  **Access the application:**
    - Frontend: `http://localhost:3000`
    - Backend API: `http://localhost:5000` (e.g., `http://localhost:5000/listings`)

---

## Common Scripts

- **Install**: `pnpm install`
- **Dev (frontend)**: `pnpm --filter frontend run dev`
- **Dev (backend)**: `pnpm --filter backend run start:dev`
- **Lint**: `pnpm --filter frontend run lint`
- **Typecheck**: `pnpm --filter frontend run typecheck`
- **Build**: `pnpm --filter frontend run build` and `pnpm --filter backend run build`
- **Format**: `pnpm --filter frontend run format`

---

## Running Tests

### Backend E2E Tests
To run the backend end-to-end tests (which include authentication and listing creation tests):
```bash
pnpm --filter backend test:e2e
```
*Note: These tests require a running PostgreSQL and Redis instance. It's recommended to run them against a clean test database.*

---

## Database Schema Management (TypeORM Migrations)

Production deployments must not use `synchronize: true`. This project is configured to:

- Disable TypeORM schema sync in production (hard off).
- Default `synchronize` to off in non‑production; opt‑in by setting `TYPEORM_SYNCHRONIZE=true` locally when needed.
- Use migrations for schema changes.

Backend changes:

- Config is in `apps/backend/src/app.module.ts` (env-driven `synchronize`).
- TypeORM DataSource for CLI is `apps/backend/ormconfig.ts`.
- Migration scripts are available in `apps/backend/package.json`.

Common commands (run from repo root):

```bash
# Generate a migration from current entity changes
pnpm --filter backend run migration:generate

# Create an empty migration (name "ManualMigration")
pnpm --filter backend run migration:create

# Run migrations
pnpm --filter backend run migration:run

# Revert last migration
pnpm --filter backend run migration:revert
```

Environment:

- Local dev: you may set `TYPEORM_SYNCHRONIZE=true` to ease local iteration (not recommended for shared environments).
- Staging/Prod: ensure `TYPEORM_SYNCHRONIZE=false` and run migrations during deployment.

CI/CD Guidance:

- Add a deploy step to run `migration:run` against the target environment/database.

---

## Run Locally with Staging Compose

Use `docker-compose.staging.yml` to simulate the staging stack locally (Postgres, Redis, backend in prod mode, frontend in prod mode).

1) Set environment variables (example values for local):

```bash
# Frontend public URLs
export NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
export NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Backend secrets and connections
export DATABASE_URL=postgresql://user:password@localhost:5432/classifieds_db
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=change_me_locally
```

2) Start the stack:

```bash
docker compose -f docker-compose.staging.yml up --build
```

Notes:
- By default, Compose will build images locally if `FRONTEND_IMAGE`/`BACKEND_IMAGE` are not provided.
- To use prebuilt images (e.g., from CI), export:
  ```bash
  export FRONTEND_IMAGE=ghcr.io/<owner>/<repo>/frontend:<tag>
  export BACKEND_IMAGE=ghcr.io/<owner>/<repo>/backend:<tag>
  ```

3) Run migrations (optional, recommended on first run):

Run from your host machine with the same `DATABASE_URL` pointing to the Compose Postgres:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/classifieds_db \
  pnpm --filter backend run migration:run
```

4) Access:
- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/health

---

## Project Structure

- `apps/backend/` — NestJS backend application
- `apps/frontend/` — Next.js frontend application
- `packages/` — Shared packages (future expansion)
- `pnpm-workspace.yaml` — Workspace definition
- `docker-compose.yml` — Defines the multi-service local development environment

---

## Development Guidelines

- **TypeScript Strict Mode:** Enabled for enhanced code quality.
- **NestJS Architecture:** Adherence to modular, service-oriented patterns.
- **Next.js App Router:** Utilizing server components and client components (`"use client"`).
- **Styling:** Tailwind CSS with custom design tokens (CSS variables) for theming.
- **Accessibility:** Focus on WCAG guidelines for all UI components.
- **Code Quality:** ESLint and Prettier configured for consistent code style.

---

## Troubleshooting

- **metadataBase warning during Next.js build**  
  If you see a warning like: `metadataBase property in metadata export is not set ... using "http://localhost:3000"`, define a canonical site URL. Example for `apps/frontend/src/app/layout.tsx`:
  ```ts
  export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  };
  ```

- **Dynamic server usage: Route / couldn't be rendered statically**  
  This occurs when a page uses `fetch` with `no-store` or otherwise dynamic data during build. Options to resolve:
  - Make the page explicitly dynamic: `export const dynamic = "force-dynamic";`
  - Or allow ISR by adding revalidation to fetch: `fetch(url, { next: { revalidate: 60 } })` and remove `cache: "no-store"`.
  - Or fetch on the client side instead of at build-time if prerendering is required.

---

## Production Deployment

This section outlines a pragmatic path to deploy both apps with Docker Compose on a single VM, plus notes for managed providers. Adjust to your infra and security policies.

### 1) Production Environment Variables

- Backend `apps/backend/.env` (example):
  ```env
  PORT=5000
  DATABASE_URL=postgresql://<user>:<pass>@<db-host>:5432/classifieds_db
  REDIS_URL=redis://<redis-host>:6379
  JWT_SECRET=change_me_in_prod
  NODE_ENV=production
  TYPEORM_SYNCHRONIZE=false
  ```
- Frontend `apps/frontend/.env.production` (example):
  ```env
  NEXT_PUBLIC_BACKEND_URL=https://api.example.com
  NEXT_PUBLIC_SITE_URL=https://example.com
  NODE_ENV=production
  ```

Never commit real secrets. Prefer a secret manager (AWS SSM, GCP Secret Manager, Vault) or CI/CD secret store.

### 2) Build & Run with Docker Compose

The repo includes `docker-compose.yml`. For production, build and run in detached mode:

```bash
docker compose build --no-cache
docker compose up -d
```

Recommended hardening:
- Put a reverse proxy (e.g., Nginx/Caddy/Traefik) in front of the frontend and backend containers.
- Terminate TLS at the proxy with certificates from Let’s Encrypt.
- Only expose necessary ports publicly (e.g., 80/443 on the proxy). Keep DB/Redis internal.

### 3) Database Migrations (Required)

Always run migrations on deploy (CI/CD or a one‑shot job):

```bash
pnpm --filter backend run migration:run
```

Ensure `TYPEORM_SYNCHRONIZE=false` in production to avoid schema drift.

### 3.5) Rollback

If a deployment introduces a critical regression, roll back quickly and safely:

- Version your images: push immutable tags (e.g., `frontend:v1.2.3`, `backend:v1.2.3`). Keep the last known-good tag available.
- Switch images to a known-good tag and redeploy:
  ```bash
  # Example if using environment overrides
  export FRONTEND_IMAGE=ghcr.io/<owner>/<repo>/frontend:<good_tag>
  export BACKEND_IMAGE=ghcr.io/<owner>/<repo>/backend:<good_tag>
  docker compose up -d
  ```
- If the issue is schema-related, revert the last migration (only if safe and designed to be down-migratable):
  ```bash
  pnpm --filter backend run migration:revert
  ```
  Notes:
  - Prefer forward-fix migrations when possible.
  - Ensure application version is compatible with the schema you revert to.

- Verify health:
  - Backend: `/health` returns 200
  - App smoke: can login, list/browse

- Backups & PITR:
  - Maintain periodic DB backups and point‑in‑time recovery for catastrophic cases where down migrations are unsafe.

### 4) Next.js Production Build

The frontend image runs a Next.js production build during Docker build. If deploying without Docker:

```bash
pnpm --filter frontend install --frozen-lockfile
pnpm --filter frontend build
pnpm --filter frontend start
```

Set `NEXT_PUBLIC_*` variables at build time so static optimization embeds correct URLs.

### 5) Health Checks

- Backend: expose a simple health endpoint (e.g., `/health`) returning 200.
- Frontend: root `/` should serve 200 once Next.js is started.
- Configure your load balancer to check these endpoints.

### 6) Logging & Monitoring

- Backend logs are concise and safe for production; ship them to your aggregator (Datadog, ELK, Loki).
- Add container restart policies and alerts for crash loops.

### 7) CI/CD (Example: GitHub Actions)

High‑level workflow:
1. Cache pnpm and build artifacts.
2. Lint, typecheck, run unit tests.
3. Build Docker images for frontend and backend and push to registry.
4. Run DB migrations.
5. Deploy by updating the stack on your server or platform.

Skeleton (pseudocode):
```yaml
name: deploy
on: { push: { branches: [ main ] } }
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter frontend run typecheck && pnpm --filter backend test
      - run: docker build -t registry.example.com/gcm-frontend:latest -f apps/frontend/Dockerfile .
      - run: docker build -t registry.example.com/gcm-backend:latest -f apps/backend/Dockerfile .
      - run: docker login registry.example.com -u ${{ secrets.REG_USER }} -p ${{ secrets.REG_PASS }}
      - run: docker push registry.example.com/gcm-frontend:latest
      - run: docker push registry.example.com/gcm-backend:latest
  deploy:
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - name: SSH and deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            docker pull registry.example.com/gcm-frontend:latest
            docker pull registry.example.com/gcm-backend:latest
            cd /srv/global-classifieds
            docker compose up -d
            docker exec backend pnpm --filter backend run migration:run
```

### 8) Managed Providers (Alternative)

- Frontend only:
  - Vercel/Netlify: point to `apps/frontend`, set env vars, build (`next build`) and deploy. Configure rewrites to API domain.
- Backend only:
  - Railway/Render/Fly.io/Heroku: deploy `apps/backend` with a managed Postgres + Redis. Set env vars and run `migration:run` on release.

### 9) Security Checklist

- Strong `JWT_SECRET` and key rotation policy.
- HTTPS everywhere (HSTS on the proxy).
- CORS: restrict origins in production.
- Rate limiting enabled on auth endpoints (already implemented).
- DB user with least privilege; regular backups.
- Keep images and base OS up‑to‑date; rebuild on CVE bumps.

### 10) Scaling Notes

- Make backend stateless; session data should be in JWT/DB/Redis.
- Add a CDN in front of the frontend for static assets and caching.
- Horizontal scale via multiple app instances behind a load balancer; ensure sticky sessions only if required.

---

## License

Custom Revenue-Share License — free for personal and small-scale use.  
Requires 1% gross revenue share if used in a product or service with more than 500,000 monthly active users.  
See [LICENSE](./LICENSE) for full terms.
