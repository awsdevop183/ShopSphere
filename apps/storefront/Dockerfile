# Build the storefront (whole workspace install for correct bins) and serve the
# static bundle via a non-root nginx on port 8080.
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @shopsphere/storefront build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner
COPY apps/storefront/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/storefront/dist /usr/share/nginx/html
EXPOSE 8080
