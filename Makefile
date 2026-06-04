.PHONY: install verify dev api worker web build build-api build-worker build-web typecheck-web lint format format-check infra app app-logs app-down reset

install:
	pnpm install --frozen-lockfile

verify:
	pnpm verify

dev:
	pnpm start:api:dev

api:
	pnpm start:api:dev

worker:
	pnpm start:worker:dev

web:
	pnpm dev:web

build:
	pnpm build

build-api:
	pnpm build:api

build-worker:
	pnpm build:worker

build-web:
	pnpm build:web

typecheck-web:
	pnpm typecheck:web

lint:
	pnpm lint

format:
	pnpm format

format-check:
	pnpm format:check

infra:
	docker compose up -d postgres

app:
	docker compose up -d --build

app-logs:
	docker compose logs -f migrate api worker web

app-down:
	docker compose down

reset:
	docker compose down -v
