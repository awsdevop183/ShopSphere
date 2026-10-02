import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { fmt, Badge, Skeleton, Empty } from '../../components/ui.tsx';

export default function Orders() {
  const [orders, setOrders] = useState<any[] | null>(null);
  useEffect(() => { api.get<any>('/api/account/orders').then((r) => setOrders(r.orders)); }, []);
  if (!orders) return <Skeleton className="h-64" />;
  if (orders.length === 0) return <Empty title="No orders yet" hint="When you place an order it will appear here." />;
  const tone = (s: string) => s === 'DELIVERED' ? 'green' : s === 'CANCELLED' ? 'red' : s === 'SHIPPED' ? 'brand' : 'amber';
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Your orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link key={o.id} to={`/account/orders/${o.id}`} className="card flex items-center justify-between p-4 hover:shadow-md">
            <div><p className="font-semibold">{o.number}</p><p className="text-sm text-ink-soft">{new Date(o.createdAt).toLocaleDateString()} · {o.itemCount} item(s)</p></div>
            <div className="flex items-center gap-4"><Badge tone={tone(o.status) as any}>{o.status}</Badge><span className="font-bold">{fmt(o.total)}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
