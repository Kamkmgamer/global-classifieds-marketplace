# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-workspace.yaml .
COPY package.json .

# Copy frontend's package.json
COPY apps/frontend/package.json ./apps/frontend/

# Install only production dependencies for the frontend
RUN pnpm install --prod --filter frontend

# Copy the rest of the source code
COPY . .

# Build the frontend application
RUN pnpm --filter frontend build

# Stage 2: Create the production image
FROM node:20-alpine

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Set the user
USER appuser

# Copy the built application from the builder stage
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/

EXPOSE 3000

CMD ["pnpm", "--filter", "frontend", "start"]