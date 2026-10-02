import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import { api } from '../lib/api.ts';
import type { Product } from '../lib/types.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { Skeleton } from '../components/ui.tsx';

export default function Home() {
  const [featured, setFeatured] = useState<Product[] | null>(null);
  const [cats, setCats] = useState<{ slug: string; name: string; blurb: string; count: number }[]>([]);
  useEffect(() => {
    api.get<{ products: Product[] }>('/api/catalog/products?featured=true&limit=8').then((r) => setFeatured(r.products));
    api.get<{ categories: any[] }>('/api/catalog/categories').then((r) => setCats(r.categories));
  }, []);
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="container-x grid gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="chip bg-white/15 w-fit mb-4">New season · up to 25% off</span>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Everything you need,<br />delivered.</h1>
            <p className="mt-4 max-w-md text-brand-100">Thoughtfully designed essentials across ten categories — shipped carbon-neutral with a 30-day promise.</p>
            <div className="mt-8 flex gap-3">
              <Link to="/products" className="btn bg-white text-brand-700 hover:bg-brand-50">Shop all <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/deals" className="btn bg-brand-500/40 text-white ring-1 ring-white/30 hover:bg-brand-500/60">View deals</Link>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-4">
            {['hero-a','hero-b','hero-c','hero-d'].map((s, i) => (
              <img key={s} src={`https://picsum.photos/seed/${s}/400/400`} alt="" className={`rounded-2xl object-cover ${i % 2 ? 'mt-8' : ''}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="container-x grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[[Truck,'Free shipping','On orders over $75'],[ShieldCheck,'Secure checkout','Simulated & safe'],[RefreshCw,'Easy returns','30-day window'],[Headphones,'Support','Here to help']].map(([I,t,s]: any, i) => (
            <div key={i} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><I className="h-5 w-5" /></span><div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-ink-soft">{s}</p></div></div>
          ))}
        </div>
      </section>

      <section className="container-x py-12">
        <h2 className="mb-6 text-2xl font-bold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {cats.map((c) => (
            <Link key={c.slug} to={`/categories/${c.slug}`} className="card group overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-slate-100"><img src={`https://picsum.photos/seed/cat-${c.slug}/400/300`} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-105" /></div>
              <div className="p-3"><p className="font-semibold text-sm">{c.name}</p><p className="text-xs text-ink-soft">{c.count} items</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x pb-16">
        <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-bold">Featured products</h2><Link to="/products" className="text-sm font-semibold text-brand-700 hover:underline">View all →</Link></div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {featured ? featured.map((p) => <ProductCard key={p.id} p={p} />) : Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </section>
    </div>
  );
}
