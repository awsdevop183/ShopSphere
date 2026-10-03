# ShopSphere business API. Builds the whole pnpm workspace so prisma/tsc bins
# resolve, then runs the compiled server WITHOUT pnpm/corepack at runtime
# (the lab network has no outbound internet).
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @shopsphere/business-api db:generate
RUN pnpm --filter @shopsphere/business-api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
WORKDIR /app/apps/business-api
USER node
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
