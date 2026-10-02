import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { setLabMode } from './helpers.js';

const app = createApp();
afterAll(async () => { await prisma.$disconnect(); });

describe('Lab: SQL injection in search', () => {
  it('vulnerable mode: UNION payload exfiltrates the internal_note flag', async () => {
    await setLabMode('sqli-search', false);
    const payload = "' UNION SELECT id, internal_note, category, price FROM lab_catalog -- ";
    const res = await request(app).get('/labs/sqli-search/').query({ q: payload });
    expect(res.status).toBe(200);
    const names = res.body.results.map((r: any) => r.name).join(' ');
    expect(names).toContain('shopsphere{sql_injection');
  });
  it('secure mode: same payload returns no rows (treated as a literal)', async () => {
    await setLabMode('sqli-search', true);
    const payload = "' UNION SELECT id, internal_note, category, price FROM lab_catalog -- ";
    const res = await request(app).get('/labs/sqli-search/').query({ q: payload });
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(0);
  });
});

describe('Lab: SQLi auth bypass', () => {
  it('vulnerable: OR 1=1 bypasses login', async () => {
    await setLabMode('sqli-login', false);
    const res = await request(app).post('/labs/sqli-login/').send({ email: "x' OR '1'='1", password: "y' OR '1'='1" });
    expect(res.body.authenticated).toBe(true);
  });
  it('secure: injection fails, valid creds work', async () => {
    await setLabMode('sqli-login', true);
    const bad = await request(app).post('/labs/sqli-login/').send({ email: "x' OR '1'='1", password: 'y' });
    expect(bad.status).toBe(401);
    const good = await request(app).post('/labs/sqli-login/').send({ email: 'partner@example.test', password: 'correct-horse-battery' });
    expect(good.body.authenticated).toBe(true);
  });
});

describe('Lab: Reflected XSS', () => {
  it('vulnerable: reflects raw script tag', async () => {
    await setLabMode('xss-reflected', false);
    const res = await request(app).get('/labs/xss-reflected/').query({ q: '<script>x()</script>' });
    expect(res.text).toContain('<script>x()</script>');
  });
  it('secure: encodes the payload and sets CSP', async () => {
    await setLabMode('xss-reflected', true);
    const res = await request(app).get('/labs/xss-reflected/').query({ q: '<script>x()</script>' });
    expect(res.text).not.toContain('<script>x()</script>');
    expect(res.text).toContain('&lt;script&gt;');
    expect(res.headers['content-security-policy']).toBeTruthy();
  });
});

describe('Lab: Stored XSS', () => {
  it('vulnerable: stored markup renders raw', async () => {
    await setLabMode('xss-stored', false);
    await request(app).post('/labs/xss-stored/reviews').send({ author: 'a', body: '<img src=x onerror=alert(1)>' });
    const res = await request(app).get('/labs/xss-stored/page');
    expect(res.text).toContain('<img src=x onerror=alert(1)>');
  });
  it('secure: stored markup is escaped on render', async () => {
    await setLabMode('xss-stored', true);
    const res = await request(app).get('/labs/xss-stored/page');
    expect(res.text).not.toContain('<img src=x onerror=alert(1)>');
    expect(res.text).toContain('&lt;img');
  });
});

describe('Lab: IDOR orders', () => {
  it("vulnerable: avery reads blair's order", async () => {
    await setLabMode('idor-orders', false);
    const res = await request(app).get('/labs/idor-orders/orders/1003').set('x-lab-user', 'avery@example.test');
    expect(res.status).toBe(200);
    expect(res.body.order.owner).toBe('blair@example.test');
  });
  it('secure: cross-owner read is 404', async () => {
    await setLabMode('idor-orders', true);
    const res = await request(app).get('/labs/idor-orders/orders/1003').set('x-lab-user', 'avery@example.test');
    expect(res.status).toBe(404);
  });
});

describe('Lab: BOLA profiles (incl. excessive data exposure)', () => {
  it('vulnerable: reads another profile incl. ssnLast4', async () => {
    await setLabMode('bola-profiles', false);
    const res = await request(app).get('/labs/bola-profiles/profiles/2').set('x-lab-user', 'avery@example.test');
    expect(res.status).toBe(200);
    expect(res.body.profile.ssnLast4).toBeDefined();
  });
  it('secure: forbidden and sensitive field stripped for own record', async () => {
    await setLabMode('bola-profiles', true);
    const other = await request(app).get('/labs/bola-profiles/profiles/2').set('x-lab-user', 'avery@example.test');
    expect(other.status).toBe(403);
    const own = await request(app).get('/labs/bola-profiles/profiles/1').set('x-lab-user', 'avery@example.test');
    expect(own.body.profile.ssnLast4).toBeUndefined();
  });
});

describe('Lab: Mass assignment', () => {
  it('vulnerable: client sets role=admin', async () => {
    await setLabMode('mass-assignment', false);
    const res = await request(app).post('/labs/mass-assignment/signup').send({ email: 'x@test', role: 'admin', storeCredit: 9999 });
    expect(res.body.account.role).toBe('admin');
    expect(res.body.account.storeCredit).toBe(9999);
  });
  it('secure: privileged fields ignored', async () => {
    await setLabMode('mass-assignment', true);
    const res = await request(app).post('/labs/mass-assignment/signup').send({ email: 'x@test', role: 'admin', storeCredit: 9999 });
    expect(res.body.account.role).toBe('customer');
    expect(res.body.account.storeCredit).toBe(0);
  });
});

describe('Lab: Function-level authz', () => {
  it('vulnerable: customer can promote', async () => {
    await setLabMode('func-level-authz', false);
    const res = await request(app).post('/labs/func-level-authz/promote').set('x-lab-role', 'customer').send({ target: 'avery@example.test' });
    expect(res.status).toBe(200);
  });
  it('secure: customer blocked, admin allowed', async () => {
    await setLabMode('func-level-authz', true);
    expect((await request(app).post('/labs/func-level-authz/promote').set('x-lab-role', 'customer').send({ target: 'a' })).status).toBe(403);
    expect((await request(app).post('/labs/func-level-authz/promote').set('x-lab-role', 'admin').send({ target: 'a' })).status).toBe(200);
  });
});

describe('Lab: JWT weaknesses', () => {
  it('vulnerable: a token forged with the guessable key "secret" is accepted as admin', async () => {
    await setLabMode('jwt-weak', false);
    const jwt = (await import('jsonwebtoken')).default;
    const forged = jwt.sign({ sub: 'attacker', role: 'admin' }, 'secret', { algorithm: 'HS256', issuer: 'shopsphere-lab' });
    const res = await request(app).get('/labs/jwt-weak/whoami').set('authorization', `Bearer ${forged}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });
  it('secure: a token forged with "secret" is rejected (strong key + strict verify)', async () => {
    await setLabMode('jwt-weak', true);
    const jwt = (await import('jsonwebtoken')).default;
    const forged = jwt.sign({ sub: 'attacker', role: 'admin' }, 'secret', { algorithm: 'HS256', issuer: 'shopsphere-lab' });
    const res = await request(app).get('/labs/jwt-weak/whoami').set('authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });
});

describe('Lab: Open redirect', () => {
  it('vulnerable: external target returned', async () => {
    await setLabMode('open-redirect', false);
    const res = await request(app).get('/labs/open-redirect/go').query({ next: 'https://evil.example/x' });
    expect(res.body.redirectTo).toBe('https://evil.example/x');
  });
  it('secure: external target blocked', async () => {
    await setLabMode('open-redirect', true);
    const res = await request(app).get('/labs/open-redirect/go').query({ next: 'https://evil.example/x' });
    expect(res.body.redirectTo).toBe('/');
    expect(res.body.blocked).toBe(true);
  });
});

describe('Lab: SSRF (mock network)', () => {
  it('vulnerable: reaches internal metadata host', async () => {
    await setLabMode('ssrf-fetch', false);
    const res = await request(app).get('/labs/ssrf-fetch/import').query({ url: 'http://internal-metadata.lab/latest/meta-data/' });
    expect(res.status).toBe(200);
    expect(res.body.body).toContain('shopsphere{ssrf');
  });
  it('secure: non-allowlisted host blocked', async () => {
    await setLabMode('ssrf-fetch', true);
    const res = await request(app).get('/labs/ssrf-fetch/import').query({ url: 'http://internal-metadata.lab/latest/meta-data/' });
    expect(res.status).toBe(400);
  });
});

describe('Lab: Path traversal (virtual FS)', () => {
  it('vulnerable: escapes public/ to read config secret', async () => {
    await setLabMode('path-traversal', false);
    const res = await request(app).get('/labs/path-traversal/download').query({ file: '../config/secrets.env' });
    expect(res.status).toBe(200);
    expect(res.body.content).toContain('shopsphere{traversal');
  });
  it('secure: traversal denied', async () => {
    await setLabMode('path-traversal', true);
    const res = await request(app).get('/labs/path-traversal/download').query({ file: '../config/secrets.env' });
    expect([403, 404]).toContain(res.status);
  });
});

describe('Lab: Negative quantity', () => {
  it('vulnerable: negative qty lowers total', async () => {
    await setLabMode('negative-quantity', false);
    const res = await request(app).post('/labs/negative-quantity/total').send({ items: [{ price: 100, quantity: 1 }, { price: 50, quantity: -5 }] });
    expect(res.body.total).toBeLessThan(100);
  });
  it('secure: negative qty rejected', async () => {
    await setLabMode('negative-quantity', true);
    const res = await request(app).post('/labs/negative-quantity/total').send({ items: [{ price: 100, quantity: 1 }, { price: 50, quantity: -5 }] });
    expect(res.status).toBe(400);
  });
});

describe('Lab: Coupon reuse', () => {
  it('vulnerable: single-use coupon redeems repeatedly', async () => {
    await setLabMode('coupon-reuse', false);
    // reset synthetic coupon state
    const { resetStores } = await import('../src/labs/fixtures.js');
    resetStores();
    await request(app).post('/labs/coupon-reuse/redeem').send({ code: 'WELCOME10' });
    const second = await request(app).post('/labs/coupon-reuse/redeem').send({ code: 'WELCOME10' });
    expect(second.body.redeemed).toBe(true);
  });
  it('secure: second redemption blocked', async () => {
    await setLabMode('coupon-reuse', true);
    const { resetStores } = await import('../src/labs/fixtures.js');
    resetStores();
    await request(app).post('/labs/coupon-reuse/redeem').send({ code: 'WELCOME10' });
    const second = await request(app).post('/labs/coupon-reuse/redeem').send({ code: 'WELCOME10' });
    expect(second.status).toBe(409);
  });
});

describe('Lab: Verbose errors', () => {
  it('vulnerable: leaks stack trace', async () => {
    await setLabMode('verbose-errors', false);
    const res = await request(app).post('/labs/verbose-errors/parse').send({ not: 'an invoice' });
    expect(res.body.stack).toBeDefined();
  });
  it('secure: generic error only', async () => {
    await setLabMode('verbose-errors', true);
    const res = await request(app).post('/labs/verbose-errors/parse').send({ not: 'an invoice' });
    expect(res.body.stack).toBeUndefined();
    expect(res.body.errorId).toBeDefined();
  });
});
