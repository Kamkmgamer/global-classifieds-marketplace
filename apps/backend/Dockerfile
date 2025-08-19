# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy backend's package.json
COPY apps/backend/package.json ./apps/backend/

# Install all workspace deps (including dev) for building
COPY pnpm-lock.yaml ./
RUN pnpm install

# Copy the rest of the source code
COPY . .

# Build the backend application
RUN pnpm --filter backend build

# Stage 2: Create the production image
FROM node:20-alpine

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy dependencies and built code from the builder stage
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend/node_modules /app/apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist /app/apps/backend/dist

USER appuser
ENV NODE_PATH=/app/node_modules:/app/apps/backend/node_modules

EXPOSE 5000
CMD ["node", "apps/backend/dist/src/main.js"]