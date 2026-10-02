import type { ReactNode } from 'react';
import { Star } from 'lucide-react';

export const fmt = (n: number) => `$${n.toFixed(2)}`;

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-500" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(value) ? 'fill-amber-400' : 'fill-slate-200 text-slate-200'}`} />
      ))}
      <span className="ml-1 text-xs text-ink-soft">{value.toFixed(1)}{count != null ? ` (${count})` : ''}</span>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

export function Empty({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {hint && <p className="max-w-md text-sm text-ink-soft">{hint}</p>}
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'green' | 'amber' | 'red' | 'slate' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700', green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', slate: 'bg-slate-100 text-slate-600',
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}
