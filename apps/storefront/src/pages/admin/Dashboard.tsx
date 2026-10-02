import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../lib/api.ts';
import { fmt, Skeleton } from '../../components/ui.tsx';

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get<any>('/api/admin/dashboard').then(setD); }, []);
  if (!d) return <Skeleton className="h-96" />;
  const chart = [
    { name: 'Mon', sales: 1200 }, { name: 'Tue', sales: 2100 }, { name: 'Wed', sales: 800 },
    { name: 'Thu', sales: 1600 }, { name: 'Fri', sales: 2400 }, { name: 'Sat', sales: 3100 }, { name: 'Sun', sales: 1900 },
  ];
  const cards = [['Orders', d.stats.orders], ['Revenue', fmt(d.stats.revenue)], ['Customers', d.stats.customers], ['Low stock', d.stats.lowStock]];
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(([l, v]) => <div key={l} className="card p-5"><p className="text-sm text-ink-soft">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>)}
      </div>
      <div className="card mt-6 p-6">
        <h2 className="mb-4 font-semibold">Sales this week</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="sales" fill="#1f47f5" radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card mt-6 p-6">
        <h2 className="mb-4 font-semibold">Recent orders</h2>
        <table className="w-full text-sm"><thead><tr className="text-left text-ink-soft"><th className="pb-2">Order</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr></thead>
          <tbody>{d.recentOrders.map((o: any) => <tr key={o.number} className="border-t border-slate-100"><td className="py-2 font-medium">{o.number}</td><td>{o.customer}</td><td>{o.status}</td><td className="text-right">{fmt(o.total)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
