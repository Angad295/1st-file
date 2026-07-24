# syntax=docker/dockerfile:1

##########################################################################
# AI Werewolf Arena — production Dockerfile (Next.js 16 standalone)
# Multi-stage build: deps -> builder -> runner
##########################################################################

# ---- Base image -------------------------------------------------------
FROM node:22-alpine AS base
# libc6-compat helps some native deps run on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Dependencies -----------------------------------------------------
FROM base AS deps
# Enable pnpm via corepack (repo uses a pnpm lockfile)
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# ---- Builder ----------------------------------------------------------
FROM base AS builder
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Skip Next.js telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- Runner (final, minimal) -----------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy the standalone server + static assets + public files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# App Runner / most PaaS inject PORT; default to 3000 for local runs.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# server.js is emitted by Next.js standalone output
CMD ["node", "server.js"]