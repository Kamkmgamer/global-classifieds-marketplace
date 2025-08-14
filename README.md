# Global Classifieds Marketplace (Monorepo)

Enterprise-grade classifieds marketplace frontend built with Next.js 15, React 19, TypeScript, Tailwind CSS, and pnpm workspaces.

This repository is a pnpm monorepo. The primary app lives in `apps/frontend/`.

---

## Prerequisites

- Node.js 20.x LTS (recommended)
- pnpm 9.x or later
- Git

Check versions:

```bash
node -v
pnpm -v
```

---

## Project Structure

- `apps/frontend/` — Next.js App Router application (TypeScript, Tailwind)
- `packages/` — Shared packages (future expansion)
- `pnpm-workspace.yaml` — Workspace definition

---

## Quick Start

1) Install dependencies at the repo root:

```bash
pnpm install
```

2) Create environment file for the frontend:

Create `apps/frontend/.env.local` and set optional public site URL (used by SEO JSON-LD only; the app works without it):

```bash
# apps/frontend/.env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3) Run the frontend app in development mode:

```bash
# From repo root
pnpm -w --filter frontend dev
# Or from the app folder
cd apps/frontend && pnpm dev
```

If port 3000 is busy, Next.js will choose another port (e.g., 3002). Use the exact URL shown in the terminal.

4) Open the app in your browser:

- Local: `http://localhost:3000` (or whichever port was printed)

---

## Available Scripts

From repo root using workspace filter:

```bash
pnpm -w --filter frontend dev        # start dev server
pnpm -w --filter frontend build      # build production bundle
pnpm -w --filter frontend start      # start production server (after build)
pnpm -w --filter frontend typecheck  # TypeScript check
pnpm -w --filter frontend lint       # ESLint
```

Or run the same inside `apps/frontend/` without the workspace filter.

---

## Features Included

- Strong security headers and CSP (relaxed for dev HMR websockets)
- API route with input validation using Zod: `GET/POST /api/listings`
- Browse page with search, sort, filters, pagination, and error boundary
- Post page with a functional listing form (mock persistence)
- Rate limiting middleware for `/api/*`
- SEO JSON-LD on the home page

---

## Common Issues & Fixes

- Port 3000 already in use
  - Kill the process on port 3000 or let Next use a different port.
  - Windows (PowerShell):
    - Find PID: `netstat -ano | findstr :3000`
    - Kill: `taskkill /PID <PID> /F`

- Dev server stuck on "Starting…" or blank page in dev
  - We allow `ws:`/`wss:` in `connect-src` CSP during development for HMR.
  - Make sure you access the exact URL printed by Next.js (it may not be 3000).
  - Clear the Next build cache: delete `apps/frontend/.next/` and re-run `pnpm dev`.

- API requests failing in dev
  - Internal fetches use relative paths (e.g., `/api/listings`), so they work on any dev port.
  - A simple in-memory rate limiter protects `/api/*`. Bursting requests may return 429.

- Lint or type errors block build
  - Run `pnpm -w --filter frontend lint` and `pnpm -w --filter frontend typecheck`.
  - Fix reported issues; the codebase is configured for strict TypeScript and ESLint.

---

## Production Build & Run

1) Build the app:

```bash
pnpm -w --filter frontend build
```

2) Start the production server:

```bash
pnpm -w --filter frontend start
```

By default, the production server listens on `PORT` (defaults to 3000):

```bash
# Example (Windows PowerShell)
$env:PORT=4000; pnpm -w --filter frontend start
```

---

## Environment Variables (Frontend)

- `NEXT_PUBLIC_SITE_URL` (optional)
  - Used for SEO JSON-LD canonical URLs and SearchAction target.
  - Example: `http://localhost:3000` in dev, your domain in prod.

The app also validates selected env vars via `src/lib/env.ts`.

---

## Testing (Recommended Setup)

This project is ready to add:
- Unit tests: Vitest + Testing Library
- E2E tests: Playwright
- CI: Lint, typecheck, test, build, and performance budgets

(If you want, ask to scaffold these and set up CI workflows.)

---

## Conventions

- TypeScript strict mode is enabled.
- App Router with server components by default; client components marked with `"use client"`.
- Styling: Tailwind CSS; UI primitives live under `src/components/ui/`.
- Avoid `any`; prefer precise types.

---

## Troubleshooting Checklist

- **__Wrong URL__**: Use the exact URL printed by dev server (Next may use an alternate port).
- **__Stuck build__**: Remove `.next/` and retry. Check ESLint errors.
- **__CSP errors__**: In dev, `ws:`/`wss:` are allowed. If blocked, restart dev to pick up config.
- **__API 429__**: You may be rate-limited. Slow down requests or adjust middleware logic.

---

## License

Custom Revenue-Share License — free for personal and small-scale use.  
Requires 1% gross revenue share if used in a product or service with more than 500,000 monthly active users.  
See [LICENSE](./LICENSE) for full terms.