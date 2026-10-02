# Multi-stage build for the ShopSphere business API (pnpm workspace).
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/business-api/package.json apps/business-api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @shopsphere/business-api db:generate \
 && pnpm --filter @shopsphere/business-api build

FROM node:22-alpine AS runner
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/business-api/dist ./apps/business-api/dist
COPY --from=build /app/apps/business-api/package.json ./apps/business-api/
COPY --from=build /app/apps/business-api/prisma ./apps/business-api/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
USER node
WORKDIR /app/apps/business-api
EXPOSE 4000
# Apply schema then start. (Use a migration step in real deployments.)
CMD ["sh", "-c", "node ../../node_modules/prisma/build/index.js db push --skip-generate && node dist/apps/business-api/src/server.js || node dist/server.js"]
