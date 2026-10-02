# Environment variables

Configured in `apps/business-api/.env` (an `.env.example` is committed).

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://shopsphere:shopsphere_dev@127.0.0.1:5432/shopsphere` | Prisma connection string |
| `SESSION_JWT_SECRET` | dev placeholder | HMAC key for trusted-platform session JWTs. **Set a strong random value in production.** |
| `PORT` | `4000` | API port |
| `BIND_HOST` | `127.0.0.1` | Interface the API binds to. Keep localhost unless you intentionally want LAN access. |
| `STOREFRONT_ORIGIN` | `http://127.0.0.1:5173` | CORS allow-origin |
| `LABS_ENABLED` | `true` | Master switch for all `/labs/*` routes. Set `false` to disable every vulnerable lab (returns 503). |
| `NODE_ENV` | `development` | Enables secure cookie flags in production |

Never commit real secrets. The lab signing keys (`jwt-weak` lab) are synthetic
and isolated from `SESSION_JWT_SECRET`.
