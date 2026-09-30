#!/bin/sh
# docker-entrypoint.sh — container boot sequence for EduNotebook.
#
# Design: the server must come up even if the database is slow or the seed
# fails. Public pages fall back to data/taxonomy.json when the DB is empty
# or unreachable, so a degraded DB never blocks boot.
#
# 1. Wait briefly for PostgreSQL (non-fatal after timeout).
# 2. `prisma db push` the postgres schema (non-fatal; creates tables).
# 3. Start the Next.js standalone server immediately (health checks pass).
# 4. Seed taxonomy + blogs in the background when SEED_ON_BOOT=true.

echo "[entrypoint] booting edunotebook..."

# Parse host/port out of DATABASE_URL.
DB_URL="${DATABASE_URL#postgresql://}"
DB_HOST="$(echo "$DB_URL" | sed -E 's#.*@([^:/]+)(:([0-9]+))?/.*#\1#')"
DB_PORT="$(echo "$DB_URL" | sed -E 's#.*@[^:/]+(:([0-9]+))?/.*#\2#')"
DB_PORT="${DB_PORT:-5432}"

echo "[entrypoint] waiting for database at ${DB_HOST}:${DB_PORT}..."
DB_OK=0
for i in $(seq 1 30); do
  if node -e "
    const net = require('net');
    const s = net.connect({ host: process.argv[1], port: Number(process.argv[2]) });
    s.on('connect', () => { s.end(); process.exit(0); });
    s.on('error', () => process.exit(1));
    setTimeout(() => process.exit(1), 2000);
  " "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "[entrypoint] database reachable"
    DB_OK=1
    break
  fi
  sleep 2
done
if [ "$DB_OK" != "1" ]; then
  echo "[entrypoint] WARNING: database not reachable after 60s, continuing anyway"
fi

if [ "$DB_OK" = "1" ]; then
  echo "[entrypoint] pushing prisma schema (postgres)..."
  # NOTE: `npx prisma` is deliberately NOT used — the runner stage does not
  # ship node_modules/.bin, so npx would try a network download. Invoke the
  # Prisma CLI entrypoint directly (package is copied into the image).
  if node ./node_modules/prisma/build/index.js db push --schema=prisma/schema.postgres.prisma; then
    echo "[entrypoint] schema push OK"
  else
    echo "[entrypoint] WARNING: schema push failed, continuing anyway"
  fi

  # Admin bootstrap (idempotent): creates/updates the admin login when
  # ADMIN_EMAIL + ADMIN_PASSWORD_HASH (bcrypt) are configured.
  if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD_HASH:-}" ]; then
    echo "[entrypoint] ensuring admin user..."
    if tsx prisma/ensure-admin.ts; then
      echo "[entrypoint] admin bootstrap OK"
    else
      echo "[entrypoint] WARNING: admin bootstrap failed, continuing anyway"
    fi
  fi

  if [ "${SEED_ON_BOOT:-false}" = "true" ]; then
    echo "[entrypoint] seeding taxonomy + blogs in background..."
    # Background: must not block health checks. Idempotent (wipes + recreates).
    # tsx is installed globally in the runner image (Dockerfile `npm i -g tsx`),
    # so invoke it directly — NOT `npx tsx` (no local .bin in the runner, and
    # npx would attempt a slow/fragile network download).
    {
      if tsx prisma/seed.ts && tsx prisma/seed-blogs.ts; then
        echo "[entrypoint] background seed complete"
      else
        echo "[entrypoint] WARNING: background seed failed"
      fi
    } >>/tmp/seed.log 2>&1 &
  fi
else
  echo "[entrypoint] WARNING: skipping schema push + seed (no database)"
fi

echo "[entrypoint] starting next.js standalone server..."
exec node server.js
