# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Invoke Next's build entry point directly instead of via "npm run build" /
# node_modules/.bin/next: in this build environment npm ci does not reliably
# recreate the .bin symlink, which makes "next: not found" fail the build
# even though the next package itself installed correctly.
RUN node node_modules/next/dist/bin/next build

# ---- Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8100
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs aikart ./aikart

RUN mkdir -p /aikart && chown nextjs:nodejs /aikart

USER nextjs

EXPOSE 8100

ENTRYPOINT ["node", "aikart/entrypoint.mjs"]
CMD ["serve"]
