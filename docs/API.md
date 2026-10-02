# API reference (summary)

Base URL (dev): `http://127.0.0.1:4000`. All trusted endpoints accept a JWT via
`Authorization: Bearer <token>` (also set as an httpOnly cookie on login).

## Auth — `/api/auth`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | – | strong password policy |
| POST | `/login` | – | returns `{ token, user }` |
| POST | `/logout` | user | revokes the server session |
| GET | `/me` | user | current user |

## Catalog — `/api/catalog` (public)
`GET /categories`, `GET /products?q=&category=&sort=&page=&limit=&featured=`,
`GET /products/:slug`, `GET /promotions`.

## Shopping — `/api/shop` (user)
`GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`,
`DELETE /cart/items/:productId`, `POST /checkout`.

## Account — `/api/account` (user, owner-scoped)
`GET/PATCH /profile`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`,
`GET/POST/DELETE /addresses`, `GET/POST/DELETE /wishlist`, `POST /reviews`,
`GET/POST /support`, `GET /support/:id`.

## Admin — `/api/admin` (ADMIN/STAFF)
`GET /dashboard`, `GET/POST /products`, `GET /orders`, `PATCH /orders/:id`,
`GET /customers`, `GET/POST /coupons`, `GET/PATCH /reviews`, `GET /audit-log` (ADMIN).

## Instructor — `/api/instructor` (INSTRUCTOR)
`GET /labs`, `GET /labs/:id`, `POST /labs/:id/mode`, `POST /labs/:id/reset`,
`GET /findings`, `GET /progress`.

## Findings — `/api/findings` (user, owner-scoped)
`GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`.

## Labs — `/labs` (intentionally vulnerable; gated by `LABS_ENABLED`)
`GET /` lists student-safe target features. Each lab mounts its own routes under
`/labs/<id>/…` (see the vulnerability catalog and instructor console).
