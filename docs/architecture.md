# Gigahub OS Architecture

Gigahub OS is a marketplace backend for project publishing, proposal submission, contract creation, milestone delivery, dispute handling, auditability, and user-scoped operational metrics.

The codebase is organized as a NestJS monorepo with separate API and worker applications. The API owns synchronous HTTP workflows. The worker owns asynchronous relay behavior for integration events persisted through the transactional outbox.

## Architectural Goals

The project is shaped around a few core goals:

* Keep business workflows explicit and easy to review.
* Keep module boundaries strong enough to evolve toward independently deployable services later.
* Persist business changes and integration events in the same database transaction.
* Keep APIs observable through structured request logs, audit logs, and dashboard metrics.
* Keep authentication, authorization, validation, throttling, and error responses consistent across the API.

## Applications

### API

The API application exposes HTTP endpoints under a versioned route prefix.

Responsibilities:

* Identity and access flows
* Profile management
* Project publishing
* Proposal submission and withdrawal
* Proposal acceptance and contract creation
* Milestone submit, approve, release, and dispute transitions
* Actor-scoped audit log browsing
* Actor dashboard metrics
* Swagger documentation
* Health checks
* Request logging and response shaping

### Worker

The worker application runs as a separate NestJS application context.

Responsibilities:

* Poll unprocessed outbox events
* Publish integration event logs through a publisher abstraction
* Mark events as processed through an idempotent attempt-based update
* Keep relay execution independent from API request latency

The current publisher logs integration events. The publisher boundary is intentionally isolated so it can later be replaced with a broker-backed implementation without changing business modules.

## Module Boundaries

The API is divided into feature modules:

* `identity`
* `users`
* `profiles`
* `projects`
* `proposals`
* `contracts`
* `milestones`
* `audit-log`
* `dashboard`
* `outbox`
* `health`

Each feature owns its HTTP layer, DTOs, presenters, services, and local domain concepts where needed.

Cross-cutting concerns live in shared libraries:

* configuration
* database access
* domain base classes
* pagination helpers
* request logging
* exception filtering
* response interception

## Workflow Overview

The main marketplace workflow is:

1. A client creates a project.
2. The client publishes the project.
3. A freelancer submits a proposal.
4. The client accepts the proposal.
5. A contract is created with funded milestones.
6. The freelancer submits milestone work.
7. The client approves and releases a milestone.
8. Either actor can open a milestone dispute before release.
9. Every important transition writes an audit log.
10. Every integration-worthy transition writes an outbox event.
11. The worker relays pending outbox events.

## Consistency Model

Business writes that must stay consistent are wrapped in database transactions.

Examples:

* Accepting a proposal updates the proposal, closes competing proposals, updates the project, creates the contract, creates milestones, records audit logs, and records an outbox event.
* Milestone transitions update the milestone, record audit logs, and record outbox events.
* Releasing the final milestone completes the contract inside the same workflow.

Optimistic concurrency is handled with version checks on state-changing writes.

## Transactional Outbox

The outbox pattern is used to avoid losing integration events when business state changes successfully.

The API writes outbox rows inside the same transaction as the business change.

The worker later reads pending events and publishes them through `OutboxEventPublisher`.

Current event names include:

* `ContractCreated`
* `MilestoneSubmitted`
* `MilestoneApproved`
* `MilestoneReleased`
* `MilestoneDisputed`

## Security Model

The API uses JWT authentication and role-based authorization.

Main actor roles:

* `CLIENT`
* `FREELANCER`

Security controls include:

* validated environment variables
* password hashing
* bearer-token authentication
* route-level role guards
* request body validation
* throttling
* secure response shaping
* consistent exception filtering
* actor-scoped data access checks
* audit trails for sensitive transitions

## Observability

The system exposes multiple layers of visibility:

* structured request logs
* consistent request IDs
* health checks
* audit logs
* actor dashboards
* worker relay logs
* Swagger documentation

The dashboard is intentionally actor-scoped. It gives each authenticated user a safe summary of project, proposal, contract, milestone, financial, queue, and recent activity state.

## Runtime Dependencies

Local runtime dependencies:

* PostgreSQL
* Node.js
* pnpm

Redis is already represented in Docker Compose for future queue-backed workflows, but the current event relay uses PostgreSQL-backed outbox polling.

## Evolution Path

The current structure is a modular monolith with a separate worker process.

The natural evolution path is:

1. Keep modules inside the same repository while workflows are still changing.
2. Replace the current outbox publisher with a broker-backed publisher.
3. Move high-throughput consumers behind the worker boundary.
4. Split modules with clear ownership into separate services only when operational pressure justifies it.
