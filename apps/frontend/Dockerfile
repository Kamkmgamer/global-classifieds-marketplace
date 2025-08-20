# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.13.1

# Accept build-time public envs for Next.js and make them available during build
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# Copy root workspace files for better install caching
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy only the frontend package manifest first (to leverage layer cache)
COPY apps/frontend/package.json ./apps/frontend/package.json

# Prime pnpm store with filtered install (best-effort)
RUN pnpm install --filter frontend...

# Copy the rest of the source code
COPY . .

# Ensure workspace links are correct after copying all manifests
RUN pnpm install --filter frontend...

# Dev stage: used by docker-compose for HMR (no production build)
FROM builder AS dev

# Default command can be overridden by compose; set a sensible default
CMD ["pnpm", "--filter", "frontend", "run", "dev"]

# Prod build stage: builds standalone output
FROM builder AS build
RUN pnpm --filter frontend build

# Stage 2: Create the production image using Next standalone output
FROM node:20-alpine AS runner

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy Next.js standalone server and static assets
COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /app/apps/frontend/public ./apps/frontend/public

USER appuser

EXPOSE 3000

# In monorepo standalone output, server entry typically resides under the app path
CMD ["node", "apps/frontend/server.js"]