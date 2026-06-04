# GigaHub Forge Frontend

GigaHub Forge Frontend is a React, Vite, and Tailwind CSS interface for the GigaHub API. It provides a focused marketplace workspace for clients and freelancers, covering discovery, authentication, profile management, project publishing, proposal handling, contract creation, milestone tracking, account activity, and service health.

The interface is designed around a blue Forge visual system with role-aware navigation, responsive workspace pages, protected routes, reusable UI primitives, and API-driven screens.

## System overview

The frontend connects to the GigaHub API through a centralized API client and exposes the main marketplace flows through a browser-based workspace.

The system supports two main user roles:

- Clients can create projects, manage their own project list, review received proposals, accept proposals into contracts, and track milestones.
- Freelancers can explore published projects, submit proposals, manage their own proposals, withdraw proposals, and follow contract and milestone state.

Shared areas such as profile, dashboard, contracts, audit logs, and health checks are available through the protected workspace after authentication.

## Main capabilities

### Public area

- Landing page with product overview and internal page navigation.
- Project exploration page with search, skill filtering, status-aware loading, and pagination.
- Project detail page with project context, required skills, budget information, and proposal entry points.
- Authentication page with login and registration modes.

### Authentication

Authentication is wired to the GigaHub API and handles access and refresh tokens separately.

Connected endpoints:

```text
/auth/register
/auth/login
/auth/refresh
/auth/logout
```

The authenticated session is stored through the frontend auth client and reused across protected API requests.

### Profile management

The profile workspace is connected to:

```text
/profiles/me
```

Supported profile features include:

- Display name, headline, avatar URL, bio, country, timezone, currency, and hourly rate editing.
- Role-aware profile type selection.
- Tag-style skill entry.
- Safe HTTP and HTTPS avatar URL handling.
- Live profile preview while editing, before saving changes.

### Projects

Project flows are connected to:

```text
/projects
/projects/me
/projects/:id
/projects/:id/publish
```

Supported project features include:

- Public project discovery.
- Project detail loading.
- Client-owned project listing.
- Project creation.
- Project publishing.
- Status filters and paginated project lists.
- Skill-based filtering for published projects.

### Proposals

Proposal flows are connected to:

```text
/projects/:projectId/proposals
/proposals/me
/proposals/:id/withdraw
/proposals/:proposalId/accept
```

Supported proposal features include:

- Freelancer proposal submission.
- Freelancer proposal management.
- Proposal withdrawal.
- Client proposal review.
- Proposal acceptance into a contract.

### Contracts and milestones

The workspace includes contract and milestone views for tracking the state of accepted work.

Supported areas include:

- Contract listing and contract detail context.
- Milestone visibility.
- Milestone submission state.
- Milestone release actions where supported by the API.
- Status filtering and pagination.

### Dashboard, audit, and health

The workspace also includes operational views for:

- Dashboard metrics and recent activity.
- Audit log review.
- API health status.

These areas help users understand current workspace state, recent actions, and service availability.

## Project structure

```text
src/
  components/
    Shared layout, navigation, pagination, icons, and reusable UI elements.

  data/
    Demo and fallback data used by selected public screens.

  hooks/
    Route, authentication, and shared state helpers.

  lib/
    API client, formatting utilities, and shared helpers.

  pages/
    Public pages, authentication pages, and protected workspace screens.
```

## Routing

The app uses hash-based client-side routing. Public and protected pages are handled inside the frontend router, while protected workspace pages require an authenticated session.

Main route groups:

```text
/
 /explore
 /projects/:id
 /auth
 /studio
 /studio/profile
 /studio/projects
 /studio/proposals
 /studio/contracts
 /studio/audit
 /studio/health
```

## Environment

Create an environment file for the web app and point it to the GigaHub API base URL.

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

The frontend reads this value through Vite and uses it as the base URL for API requests.

## Setup

Install dependencies from the repository root or from the web app workspace, depending on how the project is checked out.

```bash
pnpm install
```

Run the frontend workspace:

```bash
pnpm dev
```

For a workspace-based repository, the web app can also be run with a filtered command:

```bash
pnpm --filter web dev
```

## Scripts

Common frontend commands:

```bash
pnpm dev
pnpm build
pnpm typecheck
```

If the project is used from the repository root with workspace filters:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web typecheck
```

## Brand assets

Static brand assets are served from the public directory.

Expected asset paths:

```text
public/brand/favicon.svg
public/brand/favicon.ico
public/brand/apple-touch-icon.png
public/brand/profile-client.png
public/brand/profile-freelancer.png
```

These files are referenced by browser-relative paths such as:

```html
<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg" />
<link rel="icon" sizes="any" href="/brand/favicon.ico" />
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
```

## Development notes

- API calls are centralized in the frontend API client.
- Protected requests use the active authentication session.
- Form screens keep temporary edit state before saving.
- Pagination controls use the shared Forge input styling.
- Public screens may use fallback data when API data is not available.
- The interface is responsive and uses shared design primitives for buttons, inputs, badges, cards, and empty states.

## Quality checks

Before committing frontend changes, run:

```bash
pnpm typecheck
pnpm build
```

These commands validate TypeScript usage and verify that the frontend bundle can be generated successfully.
