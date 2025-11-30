# Global Classifieds Marketplace – Documentation Index

This documentation provides a comprehensive overview of the project, covering architecture, database, and development guidelines.

- Project: `global-classifieds-marketplace`
- Architecture: Full-stack Next.js application
- Package manager: pnpm

## Table of Contents
- [Overview](#overview)
- [Architecture](architecture.md)
- [Database](database.md)
- [How to Run](#how-to-run)
- [Testing Strategy](#testing-strategy)
- [Contribution Guidelines](#contribution-guidelines)
- [Known Gaps / Next Steps](#known-gaps--next-steps)

## Overview
The Global Classifieds Marketplace is a full‑stack Next.js application with:
- Next.js 15 (App Router) with API routes
- PostgreSQL database with Drizzle ORM
- Redis cache for performance optimization
- JWT authentication with refresh tokens
- Argon2 password hashing with bcrypt migration support
- Comprehensive security features (rate limiting, audit logging, account lockout)

Key goals:
- Provide a secure, observable, and scalable marketplace API and UI.
- Demonstrate robust auth, validation, rate limiting, and caching.

## How to Run

1. Install dependencies: `pnpm install`
2. Set up environment variables (see README.md)
3. Start PostgreSQL and Redis
4. Run database migrations: `pnpm db:push`
5. Start development server: `pnpm dev`
6. Access: `http://localhost:3000`

## Testing Strategy

- Unit tests: Jest (configured in `jest.config.ts`)
- E2E tests: Playwright (configured in `playwright.config.ts`)
- Type checking: `pnpm typecheck`
- Linting: `pnpm lint`

## Contribution Guidelines

- Conventional formatting via Prettier and ESLint
- Type checking with TypeScript; run `pnpm typecheck`
- Linting: `pnpm lint`
- Prefer adding tests for new features

## Known Gaps / Next Steps

- Expand API surface for listings CRUD and user profile management
- Add production migration workflow and CI gates
- Consider HttpOnly cookies for enhanced session security
