# =====================================================================
# Production Dockerfile — Platform for Website Analysis & Comparison
# Multi-stage build for minimal final image (~180MB)
# =====================================================================

# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Install bun for fast installs (matches dev environment)
RUN npm install -g bun

# Copy lockfile and package.json first for cache
COPY package.json bun.lock* ./
COPY prisma ./prisma

# Install production + dev dependencies (needed for build)
RUN bun install --frozen-lockfile || bun install

# Generate Prisma client
RUN bun run db:generate

# ---------- Stage 2: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g bun

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ---------- Stage 3: Production (minimal) ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Install openssl (needed by Prisma SQLite) and wget for healthchecks
RUN apk add --no-cache openssl wget

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma files for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy the seed script
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create data directory for SQLite database (persistent volume)
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start command: push schema + seed (first run only) + start server
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --accept-data-loss && node server.js"]
