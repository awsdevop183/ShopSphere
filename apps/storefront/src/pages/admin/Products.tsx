import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { fmt, Skeleton, Badge } from '../../components/ui.tsx';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[] | null>(null);
  useEffect(() => { api.get<any>('/api/admin/products').then((r) => setProducts(r.products)); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold">Products</h1>
      <div className="card mt-4 overflow-hidden">
        {!products ? <Skeleton className="h-64" /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-ink-soft"><tr><th className="p-3">Name</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
            <tbody>{products.map((p) => <tr key={p.id} className="border-t border-slate-100"><td className="p-3 font-medium">{p.name}</td><td>{p.category}</td><td>{fmt(p.price)}</td><td>{p.stock < 10 ? <Badge tone="amber">{p.stock}</Badge> : p.stock}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
