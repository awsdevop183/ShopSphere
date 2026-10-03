#!/bin/sh
# Runtime entrypoint. Uses only local binaries (no pnpm/corepack/network), so it
# works on the isolated, no-outbound lab network.
set -e
cd /app/apps/business-api
BIN=./node_modules/.bin

echo "[entrypoint] syncing database schema…"
"$BIN/prisma" db push --skip-generate --accept-data-loss

# Seed only when the catalog is empty, so restarts preserve accounts & progress.
HAS_PRODUCTS=$(node -e '
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.product.count()
  .then((c) => { console.log(c); return p.$disconnect(); })
  .catch(() => { console.log(0); process.exit(0); });
')
if [ "$HAS_PRODUCTS" = "0" ]; then
  echo "[entrypoint] empty catalog — seeding synthetic data…"
  "$BIN/tsx" prisma/seed.ts
else
  echo "[entrypoint] catalog present ($HAS_PRODUCTS products) — skipping seed."
fi

echo "[entrypoint] starting API…"
exec node dist/src/server.js
