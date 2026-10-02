import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { fmt, Skeleton, Badge } from '../../components/ui.tsx';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[] | null>(null);
  useEffect(() => { api.get<any>('/api/admin/orders').then((r) => setOrders(r.orders)); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="card mt-4 overflow-hidden">
        {!orders ? <Skeleton className="h-64" /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-ink-soft"><tr><th className="p-3">Order</th><th>Customer</th><th>Status</th><th className="text-right p-3">Total</th></tr></thead>
            <tbody>{orders.map((o) => <tr key={o.id} className="border-t border-slate-100"><td className="p-3 font-medium">{o.number}</td><td>{o.customer}</td><td><Badge tone="brand">{o.status}</Badge></td><td className="text-right p-3">{fmt(o.total)}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
