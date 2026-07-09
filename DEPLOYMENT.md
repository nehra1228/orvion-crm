# ORVION CRM Deployment

## Docker deployment

This repository is ready to deploy with Docker.

### Build and run

```bash
docker compose up -d --build
```

### Environment

Copy `.env.example` to `.env` and set secure values before starting in production.

Required environment variables:
- `DATABASE_URL` - for SQLite, use `file:./data/dev.db`
- `JWT_SECRET` - a strong secret for JWT signing
- `NODE_ENV=production`

### Access

The application will be available on `http://localhost:3000`.

### Domain setup

Point `crm.theorviongroup.com` to your server IP with a DNS A record.

If you use a reverse proxy like nginx, configure it to forward traffic from port 80/443 to port 3000.

### Example nginx config

```nginx
server {
  listen 80;
  server_name crm.theorviongroup.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### Notes

- This app uses SQLite, so the `data` directory is mounted as a volume in `docker-compose.yml`.
- If you want a managed deployment, Vercel also supports this app and can map `crm.theorviongroup.com` directly.
## Vercel (recommended for free hosting)

Vercel's Hobby plan supports Next.js and custom domains. Use a hosted Postgres DB instead of SQLite (free tiers: Supabase, Neon).

1. Push this repo to GitHub.
2. In Vercel, Import Project → choose the GitHub repo.
3. In Project Settings → Environment Variables (Production), add:
  - `DATABASE_URL` = your Postgres connection string
  - `JWT_SECRET` = a strong secret
  - `NODE_ENV` = production
4. Set the Build Command to `npm run vercel-build` (we added this script to run Prisma migrations and build).
5. Deploy and verify the site.

### Add your domain

- In Vercel: Domains → Add `crm.theorviongroup.com` and follow the DNS instructions.
- Vercel will provision HTTPS automatically.

### Troubleshooting

- If Prisma cannot connect during build, ensure `DATABASE_URL` is reachable from Vercel. You can run migrations manually via a one-off job or CI step.
- If you need help creating a Supabase/Neon project and obtaining `DATABASE_URL`, follow their docs or ask me to walk you through it.

## Automated helper script

There's a convenience PowerShell script at `scripts/deploy-vercel.ps1` that:
- creates a GitHub repo (using `gh`) and pushes your code
- generates `vercel-setup.txt` with exact Vercel commands to finish deployment

Usage:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\deploy-vercel.ps1
```

Prerequisites: `gh` (GitHub CLI) installed and authenticated. Optionally `vercel` CLI if you want to finish deployment from terminal.


