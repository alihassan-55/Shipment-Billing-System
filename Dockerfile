# Multi-stage build for Courier Billing System

# Stage 1: Build client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci

# Copy client source
COPY client/ ./

# Build client
RUN npm run build

# Stage 2: Build server and final image
FROM node:20-alpine

WORKDIR /app

# Copy root package.json for start script
COPY package.json ./

# Copy server package files
COPY server/package*.json ./server/

WORKDIR /app/server

# Install all server dependencies (including devDependencies for Prisma)
RUN npm ci

# Copy server source
COPY server/ ./

# Generate Prisma client
RUN npx prisma generate

# Copy built client from builder stage
COPY --from=client-builder /app/client/dist ../client/dist

# Remove devDependencies (keep only production dependencies)
# Prisma client is already generated, so we don't need prisma CLI in production
RUN npm prune --production

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]

