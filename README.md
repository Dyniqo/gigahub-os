# GigaHub OS

Production-grade freelance contract and escrow platform built with NestJS, PostgreSQL, Prisma, Redis, BullMQ, modular monolith architecture, domain-driven boundaries, and event-driven workflows.

## Requirements

- Node.js 24 LTS
- pnpm 10+
- Docker

## Setup

pnpm install
cp .env.example .env
docker compose up -d
pnpm build
pnpm start:api:dev

## Services

- API: [http://localhost:3000](http://localhost:3000)
- Swagger: [http://localhost:3000/docs](http://localhost:3000/docs)
- Liveness: [http://localhost:3000/api/v1/health/live](http://localhost:3000/api/v1/health/live)
- Readiness: [http://localhost:3000/api/v1/health/ready](http://localhost:3000/api/v1/health/ready)

## Architecture

GigaHub OS starts as a modular monolith and keeps clear boundaries for future service extraction.

Core applications:

- `apps/api`
- `apps/worker`

Shared libraries:

- `libs/common`
- `libs/contracts`

Planned bounded contexts:

- Identity
- Users
- Profiles
- Projects
- Proposals
- Contracts
- Milestones
- Escrow
- Ledger
- Messaging
- Notifications
- Disputes
- Audit Log
- Outbox
- Inbox
