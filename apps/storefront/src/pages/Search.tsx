import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { Product } from '../lib/types.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { Skeleton, Empty } from '../components/ui.tsx';

export default function SearchPage() {
  const [sp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const [data, setData] = useState<{ products: Product[]; total: number } | null>(null);
  useEffect(() => { setData(null); api.get<any>(`/api/catalog/products?q=${encodeURIComponent(q)}&limit=24`).then(setData); }, [q]);
  return (
    <div className="container-x py-8">
      <h1 className="text-2xl font-bold">Search results for “{q}”</h1>
      {data && <p className="mb-6 text-sm text-ink-soft">{data.total} matches</p>}
      {!data ? <div className="grid grid-cols-2 gap-5 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
        : data.products.length === 0 ? <Empty title="Nothing matched" hint="Try different keywords." />
        : <div className="grid grid-cols-2 gap-5 md:grid-cols-4">{data.products.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
    </div>
  );
}
