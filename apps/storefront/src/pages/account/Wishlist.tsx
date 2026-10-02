import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { Empty, Skeleton } from '../../components/ui.tsx';

export default function Wishlist() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => { api.get<any>('/api/account/wishlist').then((r) => setItems(r.wishlist)); }, []);
  if (!items) return <Skeleton className="h-48" />;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Wishlist</h1>
      {items.length === 0 ? <Empty title="Your wishlist is empty" hint="Tap the heart on any product to save it." /> :
        <div className="card divide-y divide-slate-100">{items.map((i) => <div key={i.id} className="flex items-center justify-between p-4"><span className="text-sm">Product {i.productId.slice(-6)}</span><button className="btn-ghost btn-sm" onClick={async () => { await api.del(`/api/account/wishlist/${i.productId}`); setItems(items.filter((x) => x.id !== i.id)); }}>Remove</button></div>)}</div>}
    </div>
  );
}
