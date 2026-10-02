import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { Skeleton } from '../../components/ui.tsx';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[] | null>(null);
  useEffect(() => { api.get<any>('/api/admin/customers').then((r) => setCustomers(r.customers)); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold">Customers</h1>
      <div className="card mt-4 overflow-hidden">
        {!customers ? <Skeleton className="h-64" /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-ink-soft"><tr><th className="p-3">Name</th><th>Email</th><th>Orders</th><th>Joined</th></tr></thead>
            <tbody>{customers.map((c) => <tr key={c.id} className="border-t border-slate-100"><td className="p-3 font-medium">{c.firstName} {c.lastName}</td><td>{c.email}</td><td>{c.orders}</td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
