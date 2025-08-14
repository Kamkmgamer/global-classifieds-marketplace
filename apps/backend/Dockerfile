# Use the official Node.js 20 LTS image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally (if not already there)
RUN npm install -g pnpm

# Install dependencies (from the host, using pnpm workspace)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN pnpm run build

# Expose the port the Express app runs on
EXPOSE 5000

# Command to run the compiled JavaScript
CMD ["pnpm", "start"]