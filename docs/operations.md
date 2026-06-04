# Operations Guide

Use these commands from the repository root.

## Full Docker Stack

Docker mode requires Docker only. Local Node.js, pnpm, and `node_modules` are not required because dependencies are installed inside the image.

Fresh clone:

```bash
git clone <repo-url>
cd gigahub-os
cp .env.example .env
cp apps/web/.env.example apps/web/.env
docker compose up --build
```

This starts PostgreSQL, runs committed Prisma migrations, then starts API, worker, and web.

Detached mode:

```bash
docker compose up -d --build
docker compose logs -f migrate api worker web
```

URLs:

```txt
Web:     http://localhost:8080
API:     http://localhost:3000/api/v1
Swagger: http://localhost:3000/docs
```

Stop containers while keeping the PostgreSQL volume:

```bash
docker compose down
```

Delete the local Docker PostgreSQL volume only when you intentionally want a clean database:

```bash
docker compose down -v
```

## Migration Behavior

Docker startup runs migrations through the one-shot `migrate` service:

```bash
pnpm prisma:migrate:deploy
```

This is production-style migration behavior:

- applies committed migrations only
- does not create new migrations
- does not reset the database
- does not drop local data
- fails startup before API/worker if the database is incompatible with the migration history

For local development schema changes, use:

```bash
pnpm prisma:migrate:dev
```

## Local Development

Create env files:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Start PostgreSQL only:

```bash
docker compose up -d postgres
```

Install dependencies and prepare Prisma:

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:migrate:dev
```

Run apps in separate terminals:

```bash
pnpm start:api:dev
pnpm start:worker:dev
pnpm dev:web
```

## Verify Before Commit

```bash
pnpm verify
```

Equivalent individual commands:

```bash
pnpm format:check
pnpm lint
pnpm typecheck:web
pnpm build
```

## Health Checks

```bash
curl http://localhost:3000/api/v1/health/live
curl http://localhost:3000/api/v1/health/ready
```

PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/v1/health/live
Invoke-RestMethod http://localhost:3000/api/v1/health/ready
```

## Demo Flow

```powershell
powershell -ExecutionPolicy Bypass -File docs/demo-flow.ps1
```

Override API base URL:

```powershell
$env:GIGAHUB_API_BASE_URL = "http://localhost:3000/api/v1"
powershell -ExecutionPolicy Bypass -File docs/demo-flow.ps1
```

## Port Configuration

Default host ports:

```txt
Web:      8080
API:      3000
Postgres: 55432
```

Override ports without editing committed files:

```bash
POSTGRES_PORT=55433 API_PORT=3001 WEB_PORT=8081 docker compose up -d --build
```

## Worker

The worker relays integration events through PostgreSQL-backed outbox polling. Redis is not required for the current runtime.
