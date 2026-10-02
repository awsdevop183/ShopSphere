// Synthetic, disposable data used exclusively by lab scenarios.
// In-memory stores make reset trivial and guarantee lab activity never touches
// real customer/order tables. One synthetic SQL table backs the SQL-injection
// lab so the flaw is a genuine (but bounded) demonstration.
import { prisma } from '../db.js';

export interface LabOrder { id: number; owner: string; number: string; total: number; items: string[]; }
export interface LabProfile { id: number; owner: string; email: string; phone: string; ssnLast4: string; }
export interface LabCoupon { code: string; percentOff: number; maxRedemptions: number; redemptions: number; }

interface Stores {
  orders: LabOrder[];
  profiles: LabProfile[];
  coupons: Record<string, LabCoupon>;
  // Virtual filesystem for the path-traversal lab (keys are "paths").
  vfs: Record<string, string>;
  // Mock internal hosts for the SSRF lab.
  mockHosts: Record<string, { status: number; body: string }>;
}

function seed(): Stores {
  return {
    orders: [
      { id: 1001, owner: 'avery@example.test', number: 'SS-LAB-1001', total: 128.5, items: ['Aurora Desk Lamp', 'Nimbus Notebook'] },
      { id: 1002, owner: 'avery@example.test', number: 'SS-LAB-1002', total: 42.0, items: ['Harbor Mug'] },
      { id: 1003, owner: 'blair@example.test', number: 'SS-LAB-1003', total: 310.75, items: ['Summit Backpack', 'Trail Bottle'] },
      { id: 1004, owner: 'casey@example.test', number: 'SS-LAB-1004', total: 999.0, items: ['Executive Chair'] },
    ],
    profiles: [
      { id: 1, owner: 'avery@example.test', email: 'avery@example.test', phone: '555-0101', ssnLast4: '0001' },
      { id: 2, owner: 'blair@example.test', email: 'blair@example.test', phone: '555-0102', ssnLast4: '0002' },
      { id: 3, owner: 'casey@example.test', email: 'casey@example.test', phone: '555-0103', ssnLast4: '0003' },
    ],
    coupons: {
      WELCOME10: { code: 'WELCOME10', percentOff: 10, maxRedemptions: 1, redemptions: 0 },
    },
    vfs: {
      'public/catalog.txt': 'ShopSphere public product catalog export.',
      'public/returns-policy.txt': '30 day returns on unopened items.',
      // Sensitive synthetic files that must NOT be reachable via traversal.
      'config/secrets.env': 'LAB_FLAG=shopsphere{traversal_reached_config_secrets}',
      'config/db.ini': '[db]\npassword=synthetic-not-a-real-secret',
    },
    mockHosts: {
      'http://internal-metadata.lab/latest/meta-data/': { status: 200, body: 'LAB_FLAG=shopsphere{ssrf_reached_internal_metadata}' },
      'http://internal-admin.lab/health': { status: 200, body: 'ok' },
      'https://images.shopsphere.test/logo.png': { status: 200, body: '[binary image bytes]' },
    },
  };
}

export let stores: Stores = seed();
export function resetStores(): void { stores = seed(); }

// Synthetic SQL table for the SQL-injection lab. Isolated from real catalog.
export async function ensureLabCatalog(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS lab_catalog (
      id serial PRIMARY KEY,
      name text NOT NULL,
      category text NOT NULL,
      price numeric(10,2) NOT NULL,
      internal_note text NOT NULL
    );`);
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT count(*)::bigint AS c FROM lab_catalog;`);
  if (Number(rows[0].c) === 0) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO lab_catalog (name, category, price, internal_note) VALUES
      ('Aurora Desk Lamp','lighting',59.00,'supplier: synthetic-co'),
      ('Nimbus Notebook','stationery',12.50,'reorder threshold 50'),
      ('Harbor Mug','kitchen',14.00,'microwave safe'),
      ('Summit Backpack','outdoor',120.00,'clearance Q3'),
      ('Executive Chair','furniture',640.00,'LAB_FLAG=shopsphere{sql_injection_read_internal_note}');`);
  }
}
export async function resetLabCatalog(): Promise<void> {
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS lab_catalog;`);
  await ensureLabCatalog();
}
