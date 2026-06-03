# API Workflow Guide

This guide describes the core demo flow exposed by the API.

## Base URL

```txt
http://localhost:3000/api/v1
```

## Swagger URL

```txt
http://localhost:3000/docs
```

## Authentication

Register a client:

```http
POST /auth/register
```

Register a freelancer:

```http
POST /auth/register
```

Login:

```http
POST /auth/login
```

Use the returned access token as a bearer token.

```txt
Bearer ACCESS_TOKEN
```

## Project Flow

Create a project as a client:

```http
POST /projects
```

Publish the project as the same client:

```http
PATCH /projects/{projectId}/publish
```

List projects:

```http
GET /projects
```

## Proposal Flow

Submit a proposal as a freelancer:

```http
POST /projects/{projectId}/proposals
```

Accept a proposal as the client who owns the project:

```http
POST /proposals/{proposalId}/accept
```

Accepting a proposal creates a contract, creates milestones, rejects competing submitted proposals, writes audit logs, and writes an outbox event.

## Milestone Flow

List contract milestones:

```http
GET /contracts/{contractId}/milestones
```

Read one milestone:

```http
GET /milestones/{milestoneId}
```

Submit a milestone as the freelancer:

```http
PATCH /milestones/{milestoneId}/submit
```

Approve a submitted milestone as the client:

```http
PATCH /milestones/{milestoneId}/approve
```

Release an approved milestone as the client:

```http
PATCH /milestones/{milestoneId}/release
```

Dispute a funded, submitted, or approved milestone as either actor:

```http
PATCH /milestones/{milestoneId}/dispute
```

## Audit Logs

Read the authenticated actor audit logs:

```http
GET /audit-logs/me?page=1&limit=20
```

Filter by resource:

```http
GET /audit-logs/me?page=1&limit=20&resourceType=MILESTONE&resourceId={milestoneId}
```

Filter by action:

```http
GET /audit-logs/me?page=1&limit=20&action=MILESTONE_DISPUTED
```

## Dashboard

Read the authenticated actor dashboard:

```http
GET /dashboard/me
```

Dashboard sections include:

* project status counts
* proposal status counts
* contract status counts
* milestone status counts
* work queue metrics
* financial metrics
* recent activity

## Worker Relay

The API writes outbox events during important state transitions.

The worker relays pending events.

Run the worker with:

```powershell
pnpm start:worker
```

Expected worker log event types include:

```txt
outbox_relay_started
outbox_relay_batch_loaded
integration_event_published
outbox_relay_event_processed
```
