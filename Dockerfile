# syntax=docker/dockerfile:1
# EduNotebook production image — Next.js 16 standalone + Prisma (PostgreSQL).
#
# Prisma notes:
# - Dev runs SQLite; production runs PostgreSQL. The schema is portable
#   (plain DateTime/String/Int fields), so the switch is just `provider`.
# - The builder runs on alpine (musl), so `prisma generate` detects the
#   linux-musl-openssl-3.0.x platform and fetches matching engines at build
#   time (needs network at image build; normal on the VPS). We pin
#   binaryTargets on the postgres schema copy so the generated client works
#   on musl at runtime.
# - `npm ci` must see network too (it downloads Prisma engines for the
#   current platform via postinstall).

# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV SWC_NATIVE_BINDING_CACHE=/tmp/swc-cache
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the postgres variant of the schema for production.
RUN cp prisma/schema.prisma prisma/schema.postgres.prisma \
  && sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.postgres.prisma \
  && sed -i 's|provider = "prisma-client-js"|provider = "prisma-client-js"\n  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]|' prisma/schema.postgres.prisma

# A dummy URL is enough: `generate` does not connect to the DB, and the app
# falls back to data/taxonomy.json when the DB is empty at build time
# (generateStaticParams), so `next build` never needs a live database.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate --schema=prisma/schema.postgres.prisma
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Prisma engines on alpine (musl) need openssl; libc6-compat for gcompat shims.
RUN apk add --no-cache openssl libc6-compat
# tsx only runs when SEED_ON_BOOT=true; kept global so it is not bundled.
RUN npm i -g --no-audit --no-fund tsx

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Standalone server output (server.js + traced deps).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets are not inside standalone output — copy per Next.js docs.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Postgres schema + entrypoint needed at container boot (db push / seed).
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.postgres.prisma ./prisma/schema.postgres.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.ts ./prisma/seed.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed-blogs.ts ./prisma/seed-blogs.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma/ensure-admin.ts ./prisma/ensure-admin.ts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/data/taxonomy.json ./data/taxonomy.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

# Prisma CLI needs the engines + schema at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
# Prisma CLI's transitive runtime deps (for `db push` at boot). Without these,
# `node ./node_modules/prisma/build/index.js db push` dies with
# "Cannot find module 'effect'" and NO tables are ever created (this silently
# broke login, /blogs and /sitemap). List derived via:
#   node -e "BFS over dependencies of @prisma/config from node_modules/*/package.json"
# Regenerate the list when Prisma is upgraded.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/c12 ./node_modules/c12
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/deepmerge-ts ./node_modules/deepmerge-ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/effect ./node_modules/effect
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/empathic ./node_modules/empathic
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@standard-schema/spec ./node_modules/@standard-schema/spec
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/chokidar ./node_modules/chokidar
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/citty ./node_modules/citty
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/confbox ./node_modules/confbox
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/consola ./node_modules/consola
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/defu ./node_modules/defu
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/destr ./node_modules/destr
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/exsolve ./node_modules/exsolve
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/fast-check ./node_modules/fast-check
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/giget ./node_modules/giget
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/jiti ./node_modules/jiti
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/node-fetch-native ./node_modules/node-fetch-native
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/nypm ./node_modules/nypm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ohash ./node_modules/ohash
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pathe ./node_modules/pathe
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/perfect-debounce ./node_modules/perfect-debounce
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pkg-types ./node_modules/pkg-types
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pure-rand ./node_modules/pure-rand
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/rc9 ./node_modules/rc9
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/readdirp ./node_modules/readdirp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tinyexec ./node_modules/tinyexec

RUN chmod +x ./scripts/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
