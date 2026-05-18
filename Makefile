install:
	pnpm install

dev:
	pnpm start:api:dev

worker:
	pnpm start:worker:dev

build:
	pnpm build

lint:
	pnpm lint

format:
	pnpm format

infra:
	docker compose up -d

infra-down:
	docker compose down
