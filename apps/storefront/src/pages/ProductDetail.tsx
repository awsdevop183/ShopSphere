import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Heart, Check } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useCart } from '../lib/cart.tsx';
import { useAuth } from '../lib/auth.tsx';
import { useToast } from '../components/Toast.tsx';
import { fmt, Rating, Skeleton, Badge } from '../components/ui.tsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const [p, setP] = useState<any>(null);
  const [img, setImg] = useState(0);
  const { add } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => { setP(null); api.get<any>(`/api/catalog/products/${slug}`).then((r) => setP(r.product)); }, [slug]);

  if (!p) return <div className="container-x grid gap-8 py-10 md:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-32" /></div></div>;

  const addToCart = async () => {
    if (!user) return toast('Please sign in to add items', 'info');
    try { await add(p.id); toast(`Added ${p.name}`); } catch { toast('Could not add', 'error'); }
  };
  const wishlist = async () => {
    if (!user) return toast('Please sign in', 'info');
    try { await api.post(`/api/account/wishlist/${p.id}`); toast('Saved to wishlist'); } catch { toast('Could not save', 'error'); }
  };

  return (
    <div className="container-x py-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-slate-100"><img src={p.images[img]?.url} alt={p.images[img]?.alt} className="h-full w-full object-cover" /></div>
          <div className="mt-3 flex gap-2">
            {p.images.map((im: any, i: number) => <button key={i} onClick={() => setImg(i)} className={`h-16 w-16 overflow-hidden rounded-lg ring-2 ${i === img ? 'ring-brand-500' : 'ring-transparent'}`}><img src={im.url} alt="" className="h-full w-full object-cover" /></button>)}
          </div>
        </div>
        <div>
          {p.category && <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">{p.category.name}</p>}
          <h1 className="mt-1 text-3xl font-bold">{p.name}</h1>
          <div className="mt-2"><Rating value={p.rating} count={p.reviews?.length} /></div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{fmt(p.price)}</span>
            {p.compareAt && <><span className="text-lg text-slate-400 line-through">{fmt(p.compareAt)}</span><Badge tone="red">Save {fmt(p.compareAt - p.price)}</Badge></>}
          </div>
          <p className="mt-4 text-ink-soft">{p.description}</p>
          <div className="mt-4">{p.stock > 0 ? <Badge tone="green"><Check className="h-3 w-3" /> In stock ({p.stock})</Badge> : <Badge tone="slate">Out of stock</Badge>}</div>
          <div className="mt-6 flex gap-3">
            <button onClick={addToCart} disabled={p.stock <= 0} className="btn-primary flex-1"><ShoppingCart className="h-4 w-4" /> Add to cart</button>
            <button onClick={wishlist} className="btn-ghost"><Heart className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold">Customer reviews</h2>
        {p.reviews?.length ? (
          <div className="space-y-4">
            {p.reviews.map((r: any) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between"><Rating value={r.rating} /><span className="text-xs text-ink-soft">{r.author}</span></div>
                <p className="mt-2 font-semibold">{r.title}</p>
                <p className="text-sm text-ink-soft">{r.body}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-ink-soft">No reviews yet.</p>}
      </section>
    </div>
  );
}
