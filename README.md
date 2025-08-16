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
- **Comprehensive Logging:** Global logging interceptors for detailed request and response tracking.
- **Performance Optimization:** Integrated Redis caching for frequently accessed data (e.g., listings) to reduce database load and improve response times.
- **Data Validation:** Strict input validation using DTOs and validation pipes for all API requests.

### Frontend (Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI)
- **Modern UI/UX:** Clean, consistent, and visually appealing design system built with Tailwind CSS and Shadcn UI components.
- **Dark/Light Mode Excellence:** Seamless and WCAG-accessible dark and light themes.
- **Intuitive User Flows:** Optimized registration, login, and listing creation processes.
- **Enhanced User Feedback:** Implemented loading skeletons and clear empty states for a smoother user experience.
- **Responsive Design:** Fully responsive and touch-friendly UI across all screen sizes.
- **Authentication Integration:** Seamless integration with the backend authentication system, managing user sessions and protecting client-side routes.

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

- Disable TypeORM schema sync in production.
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

- Local dev: `.env.development` includes `TYPEORM_SYNCHRONIZE=true` to ease local iteration.
- Staging/Prod: ensure `TYPEORM_SYNCHRONIZE=false` and run migrations during deployment.

CI/CD Guidance:

- Add a deploy step to run `migration:run` against the target environment/database.

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

(Details for production deployment would be added here in a real-world scenario, covering CI/CD, environment setup, scaling, etc.)

---

## License

Custom Revenue-Share License — free for personal and small-scale use.  
Requires 1% gross revenue share if used in a product or service with more than 500,000 monthly active users.  
See [LICENSE](./LICENSE) for full terms.
