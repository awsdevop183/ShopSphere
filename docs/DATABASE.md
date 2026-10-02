# Database

PostgreSQL 16, modelled with Prisma (`apps/business-api/prisma/schema.prisma`).

## Core models
- **Identity:** `User` (role: CUSTOMER/STAFF/ADMIN/INSTRUCTOR), `Session`
  (server-tracked JWT sessions), `CustomerProfile`, `Address`.
- **Catalog:** `Category`, `Product`, `ProductImage`, `Inventory`.
- **Commerce:** `Cart`, `CartItem`, `Order`, `OrderItem`, `PaymentSimulation`,
  `Coupon`, `Promotion`, `Review`, `WishlistItem`.
- **Support:** `SupportTicket`, `SupportMessage`.
- **Training platform:** `Lab`, `LabInstance` (holds per-lab `secureMode`),
  `StudentFinding`, `AuditEvent`.

## Notable fields
- `User.passwordHash` — bcrypt. `User.legacyPassword` — a **synthetic** plaintext
  column used only by a crypto-failure fixture; populated for one seeded account.
- `Inventory.stock/reserved/version` — supports atomic stock checks at checkout.
- `Coupon.state/maxRedemptions/redemptions/expiresAt` — coupon lifecycle.

## Relationships & integrity
Foreign keys use `onDelete: Cascade` where a child cannot outlive its parent
(images, cart items, sessions, support messages). Indexes exist on frequent
lookups (`Product.slug`, `Order.number`, `*.userId`, `User.role`).

## Synthetic lab data (not in Prisma)
The SQL-injection lab uses a raw table `lab_catalog` created on demand
(`src/labs/fixtures.ts`). IDOR/BOLA/coupon/business-logic labs use in-memory
stores. These are isolated from the Prisma-managed trusted tables.

## Commands
```bash
pnpm --filter @shopsphere/business-api db:push     # sync schema
pnpm db:seed                                        # seed synthetic data
pnpm --filter @shopsphere/business-api db:migrate   # create a migration (dev)
```
