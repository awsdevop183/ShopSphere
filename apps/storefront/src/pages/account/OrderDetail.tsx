import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useToast } from '../../components/Toast.tsx';
import { fmt, Badge, Skeleton } from '../../components/ui.tsx';

const timeline = ['PAID', 'SHIPPED', 'DELIVERED'];
export default function OrderDetail() {
  const { id } = useParams();
  const [o, setO] = useState<any>(null);
  const [err, setErr] = useState(false);
  const toast = useToast();
  const load = () => api.get<any>(`/api/account/orders/${id}`).then((r) => setO(r.order)).catch(() => setErr(true));
  useEffect(() => { load(); }, [id]);
  if (err) return <div className="card p-10 text-center"><p className="text-lg font-semibold">Order not found</p><Link to="/account/orders" className="btn-ghost mt-4">Back to orders</Link></div>;
  if (!o) return <Skeleton className="h-64" />;
  const cancel = async () => { try { await api.post(`/api/account/orders/${id}/cancel`); toast('Order cancelled'); load(); } catch (e: any) { toast(e.message, 'error'); } };
  const idx = timeline.indexOf(o.status);
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{o.number}</h1><Badge tone="brand">{o.status}</Badge></div>
      {idx >= 0 && (
        <div className="card mt-4 flex items-center justify-between p-6">
          {timeline.map((t, i) => <div key={t} className="flex flex-1 flex-col items-center"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= idx ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span><span className="mt-1 text-xs">{t}</span></div>)}
        </div>
      )}
      <div className="card mt-4 p-6">
        <h2 className="font-semibold">Items</h2>
        <ul className="mt-3 space-y-2 text-sm">{o.items.map((i: any, k: number) => <li key={k} className="flex justify-between"><span>{i.name} × {i.quantity}</span><span>{fmt(i.unitPrice * i.quantity)}</span></li>)}</ul>
        <dl className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{fmt(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount</dt><dd>-{fmt(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{o.shipping === 0 ? 'Free' : fmt(o.shipping)}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{fmt(o.total)}</dd></div>
        </dl>
      </div>
      <div className="card mt-4 p-6"><h2 className="font-semibold">Shipping to</h2><p className="mt-1 text-sm text-ink-soft">{o.shipTo}</p>{o.payment && <p className="mt-2 text-sm text-ink-soft">Paid with {o.payment.method} ending {o.payment.last4}</p>}</div>
      {['PENDING', 'PAID'].includes(o.status) && <button onClick={cancel} className="btn-ghost mt-4 text-red-600">Cancel order</button>}
    </div>
  );
}
