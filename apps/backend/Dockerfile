# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-workspace.yaml .
COPY package.json .

# Copy backend's package.json
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies for the backend
RUN pnpm install --prod --filter backend

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
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

USER appuser

EXPOSE 5000

CMD ["node", "dist/main"]