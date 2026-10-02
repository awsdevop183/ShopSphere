import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.ts';
import type { Product } from '../lib/types.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { Skeleton, Empty } from '../components/ui.tsx';

export default function Products({ preset }: { preset?: 'deals' | 'new' | 'best' }) {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState<{ products: Product[]; total: number } | null>(null);
  const [cats, setCats] = useState<{ slug: string; name: string }[]>([]);
  const page = Number(sp.get('page') ?? 1);
  const sort = sp.get('sort') ?? (preset === 'best' ? 'rating' : 'newest');

  useEffect(() => { api.get<{ categories: any[] }>('/api/catalog/categories').then((r) => setCats(r.categories)); }, []);
  useEffect(() => {
    setData(null);
    const params = new URLSearchParams({ page: String(page), limit: '12', sort });
    if (slug) params.set('category', slug);
    if (preset === 'best' || preset === 'new') params.set('limit', '12');
    api.get<any>(`/api/catalog/products?${params}`).then((r) => {
      let products = r.products as Product[];
      if (preset === 'deals') products = products.filter((p) => p.compareAt);
      setData({ products, total: r.total });
    });
  }, [slug, page, sort, preset]);

  const title = preset === 'deals' ? 'Deals' : preset === 'new' ? 'New Arrivals' : preset === 'best' ? 'Best Sellers' : slug ? cats.find((c) => c.slug === slug)?.name ?? 'Products' : 'All Products';
  const pages = data ? Math.ceil(data.total / 12) : 1;

  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">{title}</h1>{data && <p className="text-sm text-ink-soft">{data.total} products</p>}</div>
        <select value={sort} onChange={(e) => setSp({ sort: e.target.value })} className="input w-48">
          <option value="newest">Newest</option><option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option><option value="rating">Top Rated</option><option value="name">Name A–Z</option>
        </select>
      </div>
      {!data ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : data.products.length === 0 ? (
        <Empty title="No products found" hint="Try a different category or sort order." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">{data.products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          {!preset && pages > 1 && (
            <div className="mt-8 flex justify-center gap-1">
              {Array.from({ length: pages }).map((_, i) => (
                <button key={i} onClick={() => setSp({ sort, page: String(i + 1) })} className={`h-9 w-9 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-brand-600 text-white' : 'bg-white ring-1 ring-slate-200 hover:bg-slate-50'}`}>{i + 1}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
