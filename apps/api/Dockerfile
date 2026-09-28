# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @logisly/api... --frozen-lockfile=false

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @logisly/shared build && pnpm --filter @logisly/api exec prisma generate && pnpm --filter @logisly/api build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api ./apps/api
COPY docs/runbooks ./docs/runbooks
WORKDIR /app/apps/api
RUN mkdir -p /app/storage
ENV RUNBOOKS_DIR=/app/docs/runbooks
EXPOSE 3001
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/index.js"]
