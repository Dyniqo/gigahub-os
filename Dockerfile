FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable
WORKDIR /app

FROM base AS dependencies

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder

ARG DATABASE_URL=postgresql://gigahub:gigahub@localhost:5432/gigahub_os?schema=public
ENV DATABASE_URL=$DATABASE_URL

COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM base AS runner

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000

CMD ["node", "dist/apps/api/main.js"]
