import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../lib/types.ts';
import { useCart } from '../lib/cart.tsx';
import { useAuth } from '../lib/auth.tsx';
import { useToast } from './Toast.tsx';
import { fmt, Rating, Badge } from './ui.tsx';

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const discount = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;

  const onAdd = async () => {
    if (!user) { toast('Please sign in to add items', 'info'); return; }
    try { await add(p.id); toast(`Added ${p.name}`); } catch { toast('Could not add to cart', 'error'); }
  };

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:shadow-lg">
      <Link to={`/products/${p.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <img src={p.images[0]?.url} alt={p.images[0]?.alt ?? p.name} loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        {discount > 0 && <span className="absolute left-3 top-3"><Badge tone="red">-{discount}%</Badge></span>}
        {p.stock <= 0 && <span className="absolute right-3 top-3"><Badge tone="slate">Out of stock</Badge></span>}
        {p.stock > 0 && p.stock < 10 && <span className="absolute right-3 top-3"><Badge tone="amber">Low stock</Badge></span>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {p.category && <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{p.category.name}</p>}
        <Link to={`/products/${p.slug}`} className="font-semibold leading-tight hover:text-brand-700">{p.name}</Link>
        <Rating value={p.rating} />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">{fmt(p.price)}</span>
            {p.compareAt && <span className="text-sm text-slate-400 line-through">{fmt(p.compareAt)}</span>}
          </div>
          <button onClick={onAdd} disabled={p.stock <= 0} className="btn-primary btn-sm" aria-label={`Add ${p.name} to cart`}>
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
