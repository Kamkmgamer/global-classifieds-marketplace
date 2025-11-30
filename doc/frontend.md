# Frontend Documentation (Next.js)

The application is a full-stack Next.js 15 app (App Router) using React 19, TailwindCSS, and Radix UI. All API routes are handled directly within the Next.js application.

- App path: `src/app/`
- Libraries: `next@15`, `react@19`, `tailwindcss@3`, `@radix-ui/*`, `zod`
- HTTP utils: `src/lib/http.ts`
- Env helper: `src/lib/env.ts`

## Tech Stack
- Language: TypeScript
- Framework: Next.js 15 (App Router)
- UI: TailwindCSS, Radix UI primitives, shadcn/ui-like components under `src/components/ui/*`
- Testing: Jest + Testing Library, Playwright for E2E

## Routing and Pages
App Router structure under `src/app/`:
- `/` – Landing page (`page.tsx`)
- `/about` – About page
- `/browse` – Browse listings (SSR/CSR mix depending on usage)
- `/post` – Post a listing
- `/login` – Login form (`login/page.tsx`)
- `/register` – Registration form (`register/page.tsx`)
- `/api/*` – Next.js API routes for backend functionality
  - `/api/auth/*` – Authentication endpoints
  - `/api/listings/*` – Listings CRUD operations
  - `/api/health` – Health check endpoint

Shared app files:
- `layout.tsx` – Root layout, theme wrappers
- `globals.css` – Global Tailwind styles
- `loading.tsx`, `error.tsx`, `not-found.tsx` – UX fallbacks
- `manifest.ts`, `icon.tsx`, `opengraph-image.tsx`, `sitemap.ts`, `robots.ts` – metadata

## State Management
- Local component state via React hooks
- Auth context via `src/hooks/use-auth.tsx` for authentication state

## API Interactions
All HTTP calls use `src/lib/http.ts`:
- Automatically prefixes with `/api` for client-side requests
- Features: retries with backoff, timeout, JSON parsing, optional Zod validation
- Handles JWT token management automatically

Example usage in `login/page.tsx`:
```ts
const data = await api.post<undefined, { access_token: string }>("/auth/login", { email, password });
localStorage.setItem("access_token", data.access_token);
```

## Services
Business logic is organized in `src/lib/services/`:
- `auth.service.ts` – Authentication logic
- `users.service.ts` – User management
- `listings.service.ts` – Listings CRUD operations
- `password.service.ts` – Password hashing and verification
- `refresh-token.service.ts` – Refresh token management
- `audit.service.ts` – Security audit logging
