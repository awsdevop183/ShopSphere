# ShopSphere business API. Builds the whole pnpm workspace so every package's
# node_modules/.bin (prisma, tsc) is present, then runs the compiled server.
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app
# Copy the full monorepo (all workspace package.json files must be present for
# a frozen-lockfile install to resolve).
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @shopsphere/business-api db:generate
RUN pnpm --filter @shopsphere/business-api build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app
ENV NODE_ENV=production
# Carry over the installed workspace (incl. generated Prisma client + prisma CLI)
# and the compiled output.
COPY --from=build /app .
WORKDIR /app/apps/business-api
USER node
EXPOSE 4000
# Sync schema then start. DATABASE_URL is provided by the environment (compose).
CMD ["sh", "-c", "pnpm exec prisma db push --skip-generate --accept-data-loss && node dist/src/server.js"]
