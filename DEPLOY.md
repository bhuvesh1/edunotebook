# EduNotebook — Production Deploy Guide

> **Status: NOT DEPLOYED.** No VPS is provisioned yet. Everything below is
> deploy-ready and waiting — follow the steps on the day a VPS exists.

Target: Ubuntu 22.04 / 24.04 VPS → Docker Compose → Next.js standalone app +
PostgreSQL 16 + Nginx reverse proxy. Dev uses SQLite; production uses
PostgreSQL (the schema is portable — plain DateTime/String/Int fields).

---

## 1. Provision the VPS

Any provider (Hetzner, DigitalOcean, Contabo…). Minimum: 2 vCPU / 4 GB RAM /
40 GB disk. Point your domain's DNS A record at the VPS IP and wait for it
to propagate before step 7.

## 2. Install Docker

```bash
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli \
  containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER   # log out and back in afterwards
```

Verify: `docker --version && docker compose version`

## 3. Copy the project onto the VPS

Copy the whole `website/` directory (including `Dockerfile`,
`docker-compose.yml`, `.env.example`, `nginx/`, `prisma/`, `scripts/`,
`public/`, `data/`). Do **not** copy `node_modules/` or `.next/`.

```bash
# example
scp -r website/ user@YOUR_VPS_IP:/home/user/edunotebook
ssh user@YOUR_VPS_IP
cd /home/user/edunotebook
```

## 4. Configure secrets

```bash
cp .env.example .env
nano .env
```

Fill in:

- `POSTGRES_PASSWORD` — long random string (`openssl rand -base64 24`)
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
  (Auth.js v5 reads `AUTH_SECRET`; the old v4 name `NEXTAUTH_SECRET` is ignored)
- `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` — your public URL,
  e.g. `https://edunotebook.example.com`
- `SEED_ON_BOOT=true` for the first deploy only (seeds subjects/categories/
  topics from `data/taxonomy.json`; idempotent — rewrites taxonomy tables
  only, never users/sessions). Set back to `false` afterwards.

## 5. Build and start

```bash
docker compose up -d --build
```

This builds the image (Next.js standalone + `prisma generate` against the
postgres schema) and starts `db` + `app`. The app container waits for
PostgreSQL, runs `prisma db push` (creates tables on a fresh DB; **never
drops or wipes**), optionally seeds, then starts the server.

## 6. Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
docker compose logs -f app      # Ctrl+C to stop following
```

Expect `200` and log lines `[entrypoint] database reachable…` then the
Next.js ready banner.

## 7. Create the admin user

The admin tool promotes an **already-registered** user — it never creates
users and never handles passwords. Steps:

1. Open the site and sign up normally (e.g. `you@example.com`).
2. Promote that account:

```bash
docker compose exec app npx tsx scripts/make-admin.ts you@example.com
# OK: "you@example.com" is now an admin.
```

Usage recap: `npx tsx scripts/make-admin.ts user@email.com` — prints an error
and exits if the email isn't a registered user or is already an admin.

## 8. Seed taxonomy (if not done via SEED_ON_BOOT)

```bash
docker compose exec app npx tsx prisma/seed.ts
```

Optional — seed demo blog posts:

```bash
docker compose exec app npx tsx prisma/seed-blogs.ts
```

## 9. Nginx + TLS

On the host (outside Docker):

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp nginx/nginx.conf.sample /etc/nginx/sites-available/edunotebook
sudo nano /etc/nginx/sites-available/edunotebook   # set server_name
sudo ln -s /etc/nginx/sites-available/edunotebook /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d edunotebook.example.com
```

Certbot installs a systemd timer (`systemctl status certbot.timer`) that
renews automatically. After TLS is live, update `.env` (`AUTH_URL` and
`NEXT_PUBLIC_SITE_URL` → `https://…`) and `docker compose up -d` so secure
cookies engage, then add the HSTS header noted in the sample config.

## 10. Backups

Nightly database dump, kept 14 days:

```bash
# crontab -e
0 3 * * * docker exec edunotebook-db-1 pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > /home/user/backups/edunotebook-$(date +\%F).sql.gz \
  && find /home/user/backups -name 'edunotebook-*.sql.gz' -mtime +14 -delete
```

(Adjust the container name to match `docker ps` output.)

## 11. Updating

```bash
cd /home/user/edunotebook
# copy in the new code, then:
docker compose up -d --build
docker compose logs -f app   # confirm boot + schema push
```

`prisma db push` at boot applies schema changes additively — never drops data.

## 12. Logs

```bash
docker compose logs -f app        # app + entrypoint
docker compose logs -f db         # postgres
docker compose logs --tail=200 app
```

## 13. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| App container restarts; logs say "database never became reachable" | `db` unhealthy — `docker compose logs db`; check `POSTGRES_PASSWORD` has no characters breaking the URL (`@`, `/`, `:`) or URL-encode them |
| `Can't reach database server` at build | Build needs no DB (dummy `DATABASE_URL` is set in the Dockerfile). If you see this, a step is hitting the DB at build time — check `generateStaticParams` code paths |
| Prisma `P1001` on boot | Wrong `POSTGRES_*` values vs an existing `pgdata` volume. If the volume was created with different creds, `docker compose down -v` (**wipes the DB**) and re-up |
| Auth cookies not set / instant logout | `AUTH_URL` still `http://` behind an `https://` proxy → secure-cookie mismatch. Set `AUTH_URL=https://…` and redeploy |
| `next build` fails with SWC errors in Docker | `SWC_NATIVE_BINDING_CACHE=/tmp/swc-cache` is already set in the builder; ensure the build ran on the target arch (arm64 vs amd64) — build on the VPS itself |
| `client_max_body_size` 413 on 3D ZIP upload | The sample nginx config already sets `100m`; confirm the file actually loaded (`nginx -T`) |
| Out of disk | `docker system prune -af` removes old images; uploads live under the app container — back them up before pruning volumes |

---

### What `prisma db push` does (and doesn't do)

On every container boot the entrypoint runs
`npx prisma db push --schema=prisma/schema.postgres.prisma`. This **creates
missing tables/columns** on a fresh database and applies additive schema
changes on later deploys. It **never drops tables and never deletes data**.
For a production database with real users, migrations (`prisma migrate`)
would be the stricter choice later — `db push` was chosen for the simple
fresh-deploy story here.
