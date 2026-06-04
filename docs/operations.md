# Operations Guide

This guide covers the local commands used to run, verify, and reset GigaHub OS.

## Start Infrastructure

```powershell
docker compose up -d postgres
```

Redis is available through the queue profile when queue-backed workflows are needed.

```powershell
docker compose --profile queue up -d redis
```

## Stop Infrastructure

```powershell
docker compose stop
```

## Remove Local Infrastructure Data

```powershell
docker compose down -v
```

## Install Dependencies

```powershell
pnpm install
```

## Generate Prisma Client

```powershell
pnpm prisma:generate
```

## Create or Apply a Local Migration

```powershell
pnpm prisma:migrate:dev
```

## Apply Existing Migrations

```powershell
pnpm prisma:migrate:deploy
```

## Format

```powershell
pnpm format
```

## Check Formatting

```powershell
pnpm format:check
```

## Lint

```powershell
pnpm lint
```

## Type Check Web

```powershell
pnpm typecheck:web
```

## Build All Applications

```powershell
pnpm build
```

## Build API

```powershell
pnpm build:api
```

## Build Worker

```powershell
pnpm build:worker
```

## Build Web

```powershell
pnpm build:web
```

## Run API

```powershell
pnpm start:api
```

For watch mode:

```powershell
pnpm start:api:dev
```

## Run Worker

```powershell
pnpm start:worker
```

For watch mode:

```powershell
pnpm start:worker:dev
```

## Run Web Interface

```powershell
pnpm dev:web
```

The web interface reads the API base URL from:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Preview Web Build

```powershell
pnpm preview:web
```

## Run API, Worker, and Web Together

Open three terminals.

Terminal 1:

```powershell
pnpm start:api
```

Terminal 2:

```powershell
pnpm start:worker
```

Terminal 3:

```powershell
pnpm dev:web
```

## Swagger

```powershell
Start-Process http://localhost:3000/docs
```

Use the full bearer value in Swagger authorization:

```txt
Bearer ACCESS_TOKEN
```

## Health Checks

Live check:

```powershell
Invoke-RestMethod http://localhost:3000/api/v1/health/live
```

Ready check:

```powershell
Invoke-RestMethod http://localhost:3000/api/v1/health/ready
```

## Demo Flow

Run the full demo script after the API is running:

```powershell
powershell -ExecutionPolicy Bypass -File docs/demo-flow.ps1
```

Run the worker in a second terminal to see outbox relay logs while the demo creates workflow events.

The script uses `http://localhost:3000/api/v1` by default. To point it at another API base URL:

```powershell
$env:GIGAHUB_API_BASE_URL = "http://localhost:3000/api/v1"
powershell -ExecutionPolicy Bypass -File docs/demo-flow.ps1
```

## Generated Client

The Prisma client is generated under the common database library path. Do not commit generated output.

Before committing after a generate command:

```powershell
git reset libs/common/src/infrastructure/database/generated
```

## Suggested Local Verification Sequence

Terminal 1:

```powershell
docker compose up -d postgres
pnpm prisma:generate
pnpm format:check
pnpm lint
pnpm typecheck:web
pnpm build
pnpm start:api
```

Terminal 2:

```powershell
pnpm start:worker
```

Terminal 3:

```powershell
pnpm dev:web
```

Terminal 4:

```powershell
powershell -ExecutionPolicy Bypass -File docs/demo-flow.ps1
```
