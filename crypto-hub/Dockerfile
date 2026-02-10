# ============================================
# CryptoHub — Multi-stage Dockerfile for Railway
# ============================================

# Stage 1: Build the frontend (React + Vite)
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build the backend (TypeScript)
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx tsc --project tsconfig.json
RUN cp src/db/schema.sql dist/db/schema.sql

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Copy server package files and install production deps only
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled server
COPY --from=server-build /app/server/dist ./dist

# Copy built frontend into server's public directory
COPY --from=client-build /app/client/dist ./public

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-3001}

# Start the server
CMD ["node", "dist/index.js"]
