import type { LabDefinition } from '../types.js';
import { stores, resetStores } from '../fixtures.js';

// --- Lab: Negative quantity price manipulation ----------------------------
export const negativeQty: LabDefinition = {
  id: 'negative-quantity',
  title: 'Cart total calculator',
  category: 'Business Logic',
  difficulty: 'easy',
  summary: 'Compute a cart total from line items ({price, quantity}).',
  affectedEndpoint: 'POST /labs/negative-quantity/total',
  rootCause: 'Quantity is not validated as a positive integer, so a negative quantity subtracts from the total (and can zero it out or go negative).',
  impact: 'Pay far less than owed, or drive the total negative to extract store credit.',
  remediation: 'Validate quantity as an integer >= 1 per line; reject otherwise.',
  reproduction: 'items=[{price:100,quantity:1},{price:50,quantity:-5}] => total goes negative.',
  instructorNotes: 'Secure branch rejects any quantity < 1 or non-integer.',
  mount(router) {
    router.post('/total', (req, res) => {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      if (req.labSecure) {
        for (const it of items) {
          if (!Number.isInteger(it?.quantity) || it.quantity < 1 || typeof it?.price !== 'number' || it.price < 0) {
            return res.status(400).json({ mode: 'secure', error: 'Invalid line item' });
          }
        }
      }
      const total = items.reduce((s: number, it: any) => s + Number(it.price) * Number(it.quantity), 0);
      res.json({ mode: req.labSecure ? 'secure' : 'vulnerable', total });
    });
  },
};

// --- Lab: Coupon reuse / redemption race ----------------------------------
export const couponReuse: LabDefinition = {
  id: 'coupon-reuse',
  title: 'Coupon redemption',
  category: 'Business Logic / Concurrency',
  difficulty: 'medium',
  summary: 'Redeem a single-use coupon (WELCOME10).',
  affectedEndpoint: 'POST /labs/coupon-reuse/redeem',
  rootCause: 'The redemption check and the increment are not atomic / not enforced, so a single-use coupon can be redeemed repeatedly.',
  impact: 'Stack a one-time discount unlimited times.',
  remediation: 'Enforce the limit atomically (conditional update / unique redemption record / transaction).',
  reproduction: 'POST {"code":"WELCOME10"} repeatedly — vulnerable mode keeps succeeding.',
  instructorNotes: 'Vulnerable branch increments without enforcing maxRedemptions. Secure branch enforces it.',
  reset: async () => { resetStores(); },
  mount(router) {
    router.post('/redeem', (req, res) => {
      const code = String(req.body?.code ?? '').toUpperCase();
      const coupon = stores.coupons[code];
      if (!coupon) return res.status(404).json({ error: 'Unknown coupon' });
      if (req.labSecure) {
        if (coupon.redemptions >= coupon.maxRedemptions) {
          return res.status(409).json({ mode: 'secure', error: 'Coupon already redeemed', redemptions: coupon.redemptions });
        }
        coupon.redemptions += 1;
        return res.json({ mode: 'secure', redeemed: true, percentOff: coupon.percentOff, redemptions: coupon.redemptions });
      }
      coupon.redemptions += 1; // no limit enforced
      res.json({ mode: 'vulnerable', redeemed: true, percentOff: coupon.percentOff, redemptions: coupon.redemptions });
    });
    router.get('/status', (_req, res) => res.json({ coupons: stores.coupons }));
  },
};
