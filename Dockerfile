# ==============================================================================
# Smart City Service Portal - Production Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build Frontend Single Page Application (React + Vite + Tailwind)
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm ci

# Copy client source and build production bundle
COPY client/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Server Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install curl/wget for healthchecks
RUN apk add --no-cache curl wget

# Copy backend dependencies and install production-only modules
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy backend application source
COPY server/ ./

# Copy compiled frontend distribution from client-builder stage
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose unified application port
EXPOSE 5000

# Health check probe against API health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

# Start production server
CMD ["node", "src/server.js"]

