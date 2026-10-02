# Build the storefront and serve it via nginx (non-root, port 8080).
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/storefront/package.json apps/storefront/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @shopsphere/storefront build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner
COPY apps/storefront/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/storefront/dist /usr/share/nginx/html
EXPOSE 8080
