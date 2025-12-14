# Multi-stage build için Dockerfile

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Package dosyalarını kopyala
COPY package.json package-lock.json* ./
# Postinstall script'ini atla çünkü schema henüz yok
RUN npm ci --ignore-scripts

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Dependencies'leri kopyala
COPY --from=deps /app/node_modules ./node_modules
# Prisma schema'yı önce kopyala
COPY prisma ./prisma
# Sonra diğer dosyaları kopyala
COPY . .

# Prisma Client'ı generate et
RUN npx prisma generate

# Next.js uygulamasını build et
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# OpenSSL ve gerekli kütüphaneleri yükle (Prisma için)
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Sistem kullanıcısı oluştur
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Gerekli dosyaları kopyala
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Public klasörü oluştur (Next.js standalone output public'i içerir, ama yine de oluşturalım)
RUN mkdir -p ./public

# Prisma schema, seed script ve client'ı kopyala
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# Prisma CLI'yi kopyala (db push için gerekli)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# tsx ve tüm bağımlılıklarını kopyala (seed script için gerekli)
# Tüm devDependencies'i kopyala (tsx ve bağımlılıkları için)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/typescript ./node_modules/typescript
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps
# esbuild'in platform binary'leri (tüm platformlar için)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@esbuild ./node_modules/@esbuild
# tsx'in diğer bağımlılıkları için .bin klasörünü kopyala
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin
# Seed script için gerekli dependencies (bcryptjs ve @prisma/client zaten var)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@types ./node_modules/@types

# Veritabanı dizini oluştur
RUN mkdir -p /app/prisma/prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

