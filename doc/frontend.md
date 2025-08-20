# Frontend Documentation (Next.js)

The frontend is a Next.js 15 app (App Router) using React 19, TailwindCSS, and Radix UI. It communicates with the backend via a typed HTTP utility that supports retries, timeouts, and optional schema validation (Zod).

- App path: `apps/frontend/src/app/`
- Libraries: `next@15`, `react@19`, `tailwindcss@3`, `@radix-ui/*`, `zod`
- HTTP utils: `apps/frontend/src/lib/http.ts`
- Env helper: `apps/frontend/src/lib/env.ts`

## Tech Stack
- Language: TypeScript
- Framework: Next.js 15 (App Router)
- UI: TailwindCSS, Radix UI primitives, shadcn/ui-like components under `src/components/ui/*`
- Testing: Jest + Testing Library, Playwright for E2E

## Routing and Pages
App Router structure under `apps/frontend/src/app/`:
- `/` – Landing page (`page.tsx`)
- `/about` – About page
- `/browse` – Browse listings (SSR/CSR mix depending on usage)
- `/post` – Post a listing (future feature)
- `/login` – Login form (`login/page.tsx`)
- `/register` – Registration form (`register/page.tsx`)
- `/api/*` – Next.js API routes used as proxy/health checks
  - `/api/health` → implemented in `src/app/api/health/route.ts`

Shared app files:
- `layout.tsx` – Root layout, theme wrappers
- `globals.css` – Global Tailwind styles
- `loading.tsx`, `error.tsx`, `not-found.tsx` – UX fallbacks
- `manifest.ts`, `icon.tsx`, `opengraph-image.tsx`, `sitemap.ts`, `robots.ts` – metadata

## State Management
- Local component state via React hooks.
- No Redux or Context found; consider Context/Server Actions for auth session if needed.

## API Interactions
All HTTP calls use `src/lib/http.ts`:
- Adds base URL:
  - On client: prefixes with `/api` to hit Next API proxy
  - On server: uses `env.NEXT_PUBLIC_BACKEND_URL` if set
- Features: retries with backoff, timeout, JSON parsing, optional Zod validation.

Example usage in `login/page.tsx`:
```ts
const data = await api.post<undefined, { access_token: string }>("/auth/login", { email, password });
localStorage.setItem("access_token", data.access_token);
```

Example GET with schema:
```ts
import { z } from "zod";
const listingSchema = z.object({ id: z.string().uuid(), title: z.string(), price: z.number() });
const item = await api.get<typeof listingSchema, z.infer<typeof listingSchema>>("/listings/123", { schema: listingSchema });
```

### Next API Proxying
- Client requests are routed to `/api/*`; you can implement proxy handlers to forward to the backend, adding headers/cookies.
- Base health route exists at `src/app/api/health/route.ts`.

## UI Components
- Inputs, buttons, cards under `src/components/ui/*` (shadcn-style).
- Icons via `lucide-react`.
- Theming via `next-themes` (see `layout.tsx`).

## Styling and Theming
- TailwindCSS configured; classes used across pages and components.
- Prettier plugin for Tailwind ordering.

## Authentication UX
- Login and Register pages post to `/auth/login` and `/auth/register` via `api` helper.
- For demo, stores `access_token` in `localStorage` and writes a lightweight `session` cookie for guard compatibility.
- Recommended improvement: migrate to HttpOnly, Secure cookies and leverage Next Middleware or server actions for session management.

## Build and Deployment
- Dockerfile produces standalone build and runs `apps/frontend/server.js`.
- Dev script: `pnpm --filter frontend run dev` (HMR via compose `dev` stage).
- Env inputs used at build time: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SITE_URL`.
- Public envs must be prefixed with `NEXT_PUBLIC_`.

## Testing
- Unit: Jest + Testing Library (`@testing-library/react`, `@testing-library/jest-dom`).
- E2E: Playwright (`pnpm --filter frontend run e2e`).

## Security Considerations
- Avoid storing sensitive tokens in `localStorage` in production.
- Ensure `/api` proxy strips sensitive headers and enforces CORS/CSRF as appropriate.
