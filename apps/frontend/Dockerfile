# Use the official Node.js 20 LTS image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally (if not already there)
RUN npm install -g pnpm

# Install dependencies (from the host, using pnpm workspace)
# We use --frozen-lockfile to ensure reproducible builds
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN pnpm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Command to run the Next.js application in production mode
CMD ["pnpm", "start"]