# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV NPM_CONFIG_REGISTRY=$NPM_REGISTRY
ENV npm_config_registry=$NPM_REGISTRY
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
  npm install -g pnpm@10.0.0 --registry=$NPM_REGISTRY

FROM base AS deps

ENV NODE_ENV=development

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

RUN --mount=type=cache,id=apt-cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,id=apt-lib,target=/var/lib/apt,sharing=locked \
  rm -f /etc/apt/apt.conf.d/docker-clean \
  && apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile --fetch-retries=10

FROM deps AS prisma

ARG DATABASE_URL=postgresql://gigahub:gigahub@postgres:5432/gigahub_os?schema=public
ARG PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV PRISMA_ENGINES_MIRROR=$PRISMA_ENGINES_MIRROR

COPY prisma.config.ts ./
COPY prisma ./prisma

RUN --mount=type=cache,id=prisma-cache,target=/root/.cache/prisma \
  DATABASE_URL=$DATABASE_URL pnpm exec prisma version

RUN --mount=type=cache,id=prisma-cache,target=/root/.cache/prisma \
  DATABASE_URL=$DATABASE_URL pnpm prisma:generate

FROM prisma AS migrator

CMD ["pnpm", "prisma:migrate:deploy"]

FROM prisma AS builder

ARG DATABASE_URL=postgresql://gigahub:gigahub@postgres:5432/gigahub_os?schema=public
ARG VITE_API_BASE_URL=http://localhost:3000/api/v1

ENV DATABASE_URL=$DATABASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV NODE_ENV=development

COPY tsconfig.json tsconfig.build.json nest-cli.json webpack.config.js ./
COPY apps ./apps
COPY libs ./libs

RUN pnpm build \
  && pnpm prune --prod

FROM nginx:1.27-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

FROM base AS runtime

ENV NODE_ENV=production

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

RUN --mount=type=cache,id=apt-runtime-cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,id=apt-runtime-lib,target=/var/lib/apt,sharing=locked \
  rm -f /etc/apt/apt.conf.d/docker-clean \
  && apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

FROM runtime AS worker

CMD ["node", "dist/apps/worker/main.js"]

FROM runtime AS runner

EXPOSE 3000

CMD ["node", "dist/apps/api/main.js"]