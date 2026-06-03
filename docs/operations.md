# Operations Guide

This guide covers the local commands used to run, verify, and reset Gigahub OS.

## Start Infrastructure

```powershell
docker compose up -d postgres
```

Redis is not required for the current workflow.

When a future queue-backed flow is added, start Redis with:

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

## Lint

```powershell
pnpm lint
```

## Build

```powershell
pnpm build
```

## Run API

```powershell
pnpm start:api
```

## Run Worker

```powershell
pnpm start:worker
```

## Run API and Worker Together

Open two terminals.

Terminal 1:

```powershell
pnpm start:api
```

Terminal 2:

```powershell
pnpm start:worker
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

## Generated Client

The Prisma client is generated under the common database library path. Do not commit generated output.

Before committing after a generate command:

```powershell
git reset libs/common/src/infrastructure/database/generated
```

## Suggested Local Verification Sequence

```powershell
docker compose up -d postgres
pnpm prisma:generate
pnpm format
pnpm lint
pnpm build
pnpm start:api
```

Then run in another terminal:

```powershell
pnpm start:worker
```

Then run in another terminal:

```powershell
powershell -ExecutionPolicy Bypass -File docs/demo-flow.ps1
```
