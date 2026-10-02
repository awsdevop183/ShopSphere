# Troubleshooting

**API can't connect to the database**
Check `DATABASE_URL` in `apps/business-api/.env` and that PostgreSQL is running:
`pg_isready`. Create the db/role per [INSTALL.md](INSTALL.md).

**`relation "..." does not exist`**
Run `pnpm --filter @shopsphere/business-api db:push` then `pnpm db:seed`.

**Storefront shows no products / network errors**
Make sure the API is running on :4000. The Vite dev server proxies `/api` and
`/labs` to it (see `apps/storefront/vite.config.ts`).

**Placeholder product images don't load**
Images use `picsum.photos`. If your network blocks it, images show alt text only;
the app still works. Swap the URLs in `prisma/seed.ts` for a local asset path if
needed.

**A lab behaves "securely" when it should be vulnerable**
It's probably toggled to secure mode. In the instructor console, toggle it back,
or clear the override: `DELETE FROM "LabInstance";` re-defaults all labs to
vulnerable. Running the test suite leaves labs in secure mode — reset afterward.

**All labs return 503**
`LABS_ENABLED` is `false`. Set it to `true` in `.env`.

**Tests fail with connection errors**
Tests run against the dev database. Ensure it's up and seeded first.

**Docker: build is slow or offline**
The `lab-net` network is `internal: true` (no outbound). Image pulls happen on
the default network during build; ensure Docker can pull base images, then
`docker compose up`.
