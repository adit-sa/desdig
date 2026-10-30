# -----------------------------------------------------------------------------
# 1. Base & Dependencies Stage
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Salin manifest dependensi
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependensi secara deterministik
RUN npm ci

# -----------------------------------------------------------------------------
# 2. Builder Stage
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Set environment produksi saat build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Kompilasi aplikasi Next.js
RUN npm run build

# -----------------------------------------------------------------------------
# 3. Production Runner Stage (Minimal Image Size ~150MB)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Buat grup dan pengguna non-root demi keamanan produksi
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Salin aset publik dan output standalone dari builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Jalankan server standalone bawaan Next.js
CMD ["node", "server.js"]
