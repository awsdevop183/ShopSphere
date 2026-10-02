import type { Response } from 'express';

export function money(n: number): string {
  return n.toFixed(2);
}

export function fail(res: Response, status: number, message: string, extra?: Record<string, unknown>) {
  return res.status(status).json({ error: message, ...extra });
}

export function orderNumber(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.floor(100000 + Math.random() * 900000);
  return `SS-${stamp}-${rnd}`;
}

// Decimal fields come back as Prisma.Decimal; normalise to number for JSON.
export function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number((v as { toString(): string }).toString());
}
