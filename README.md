# Global Classifieds Marketplace

An enterprise-grade classifieds marketplace application built as a full-stack Next.js application. Designed for scalability, security, and an exceptional user experience.

---

## Key Features & Enhancements

This project has been elevated to an enterprise-grade standard with the following key features:

### Full-Stack Next.js Application
- **Modern Framework:** Built with Next.js 15 (App Router), providing both frontend UI and API routes
- **Type Safety:** Full TypeScript support throughout the application
- **Database Integration:** Persistent data storage using PostgreSQL with Drizzle ORM for efficient and type-safe database interactions
- **Authentication & Authorization:** Secure JWT-based authentication system with user registration, login, refresh tokens, and account lockout protection
- **Performance Optimization:** Integrated Redis caching for frequently accessed data (e.g., listings) to reduce database load and improve response times
- **Security:** Comprehensive security headers, rate limiting, audit logging, and secure password hashing (Argon2 with bcrypt migration support)

### Frontend Features
- **Modern UI/UX:** Clean, consistent, and visually appealing design system built with Tailwind CSS and Shadcn UI components
- **Dark/Light Mode:** Seamless and WCAG-accessible dark and light themes
- **Intuitive User Flows:** Optimized registration, login, and listing creation processes
- **Enhanced User Feedback:** Loading skeletons and clear empty states for a smoother user experience
- **Responsive Design:** Fully responsive and touch-friendly UI across all screen sizes
- **Dev‑Only Accessibility Audits:** `@axe-core/react` runs automatically in development to flag common a11y issues

---

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Caching:** Redis (via `cache-manager-redis-store`)
- **Authentication:** Clerk (managed authentication service)
- **UI:** Tailwind CSS, Shadcn UI (Radix UI primitives)
- **Validation:** Zod, class-validator
- **Package Manager:** pnpm

---

## Prerequisites

- Node.js 20.x LTS (recommended)
- pnpm 10.x or later
- PostgreSQL 16+ and Redis 7+ (install locally or use Docker)
- Git

Check versions:

```bash
node -v
pnpm -v
psql --version
redis-server --version
```

---

## Quick Start (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kamkmgamer/global-classifieds-marketplace.git
   cd global-classifieds-marketplace
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```
   *If prompted by pnpm to approve build scripts (e.g., for `sharp`), select them all and press Enter.*

3. **Set up environment variables:**
   Create `.env.local` in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/classifieds_db
   
   # Redis
   REDIS_URL=redis://localhost:6379
   # OR
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # Clerk Authentication
   # Get these from https://dashboard.clerk.com
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Optional: Clerk configuration
   # NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
   # NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
   # NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/browse
   # NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/browse
   
   # Public URLs (if different from default)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Start PostgreSQL and Redis locally** (ensure services are running)

5. **Run database migrations:**
   ```bash
   pnpm db:push
   ```

6. **Start the development server:**
   ```bash
   pnpm dev
   ```

7. **Access the application:**
   - Application: `http://localhost:3000`
   - API routes: `http://localhost:3000/api/*`
   - Health check: `http://localhost:3000/api/health`

---

## Common Scripts

- **Dev**: `pnpm dev` - Start development server
- **Build**: `pnpm build` - Build for production
- **Start**: `pnpm start` - Start production server
- **Lint**: `pnpm lint` - Run ESLint
- **Check**: `pnpm check` - Run ESLint and TypeScript checks
- **Typecheck**: `pnpm typecheck` - Type check without emitting files
- **Format**: `pnpm format` - Format code with Prettier
- **DB Push**: `pnpm db:push` - Push database schema changes
- **DB Studio**: `pnpm db:studio` - Open Drizzle Studio for database management

---

## Project Structure

```
/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   │   ├── api/          # API routes (auth, listings, etc.)
│   │   ├── browse/       # Browse listings page
│   │   ├── login/        # Login page
│   │   └── register/     # Registration page
│   ├── components/       # React components
│   ├── lib/              # Utilities and services
│   │   └── services/     # Business logic services
│   ├── db/               # Database schema
│   └── hooks/            # React hooks
├── public/               # Static assets
├── tests/                # E2E tests (Playwright)
└── package.json          # Dependencies and scripts
```

---

## API Routes

The application includes the following API routes:

- **Auth:**
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `POST /api/auth/refresh` - Refresh access token
  - `POST /api/auth/logout` - Logout (revoke refresh token)
  - `POST /api/auth/logout-all` - Logout all devices
  - `GET /api/auth/me` - Get current user

- **Listings:**
  - `GET /api/listings` - Get all listings (with pagination, filters, search)
  - `POST /api/listings` - Create a new listing (authenticated)
  - `GET /api/listings/[id]` - Get a specific listing
  - `PATCH /api/listings/[id]` - Update a listing (authenticated)
  - `DELETE /api/listings/[id]` - Delete a listing (authenticated)

- **Health:**
  - `GET /api/health` - Health check endpoint

---

## Database Schema Management

This project uses Drizzle ORM with PostgreSQL for database management.

- Schema is in `src/db/schema.ts`
- Common commands:

```bash
# Push schema changes directly (dev only)
pnpm db:push

# Open Drizzle Studio to view/edit data
pnpm db:studio
```

For production, generate and apply migrations using Drizzle Kit.

---

## Development Guidelines

- **TypeScript Strict Mode:** Enabled for enhanced code quality
- **Next.js App Router:** Utilizing server components and client components (`"use client"`)
- **Styling:** Tailwind CSS with custom design tokens (CSS variables) for theming
- **Accessibility:** Focus on WCAG guidelines for all UI components
- **Code Quality:** ESLint and Prettier configured for consistent code style

---

## Security Features

- **Authentication:** Clerk provides secure authentication with built-in security features
- **Rate Limiting:** API rate limiting with Redis
- **Security Headers:** CSP, HSTS, and other security headers via Next.js middleware

---

## Production Deployment

### Environment Variables

Create `.env.production`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/classifieds_db
REDIS_URL=redis://host:6379
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Build and Deploy

```bash
pnpm build
pnpm start
```

Or deploy to Vercel/Netlify:

```bash
vercel deploy
```

### Database Migrations

Always run migrations before deploying:

```bash
DATABASE_URL=your_production_url pnpm db:push
```

---

## Troubleshooting

- **Database Connection Issues:** Ensure PostgreSQL is running and DATABASE_URL is correct
- **Redis Connection Issues:** Check REDIS_URL or REDIS_HOST/REDIS_PORT settings
- **Build Errors:** Clear `.next` folder and `node_modules`, then reinstall dependencies
- **Type Errors:** Run `pnpm typecheck` to see detailed TypeScript errors

---

## License

Custom Revenue-Share License — free for personal and small-scale use.  
Requires 1% gross revenue share if used in a product or service with more than 500,000 monthly active users.  
See [LICENSE](./LICENSE) for full terms.
