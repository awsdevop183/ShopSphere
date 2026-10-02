import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart.tsx';
import { api } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { fmt, Empty } from '../components/ui.tsx';

const steps = ['Address', 'Shipping', 'Payment'];
export default function Checkout() {
  const { cart, refresh } = useCart();
  const toast = useToast();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [shipTo, setShipTo] = useState('');
  const [coupon, setCoupon] = useState('');
  const [last4, setLast4] = useState('4242');
  const [busy, setBusy] = useState(false);

  if (!cart || cart.items.length === 0) return <div className="container-x py-10"><Empty title="Your cart is empty" /></div>;
  const shipping = cart.subtotal >= 75 ? 0 : 6.99;

  const place = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ orderId: string; number: string }>('/api/shop/checkout', {
        shipTo, couponCode: coupon || undefined, payment: { method: 'card', last4 },
      });
      await refresh();
      toast(`Order ${r.number} placed!`);
      nav(`/account/orders/${r.orderId}`);
    } catch (e: any) { toast(e.message ?? 'Checkout failed', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="mt-4 flex gap-2">
          {steps.map((s, i) => <div key={s} className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium ${i <= step ? 'bg-brand-600 text-white' : 'bg-white ring-1 ring-slate-200 text-ink-soft'}`}>{i + 1}. {s}</div>)}
        </div>
        <div className="card mt-6 p-6">
          {step === 0 && (<div><label className="label">Shipping address</label><textarea className="input h-28" value={shipTo} onChange={(e) => setShipTo(e.target.value)} placeholder="Full name, street, city, region, postal code" /><button className="btn-primary mt-4" disabled={shipTo.length < 5} onClick={() => setStep(1)}>Continue</button></div>)}
          {step === 1 && (<div><p className="font-medium">Standard delivery</p><p className="text-sm text-ink-soft">{shipping === 0 ? 'Free (orders over $75)' : fmt(shipping)} · 3–5 business days</p><div className="mt-4 flex gap-2"><button className="btn-ghost" onClick={() => setStep(0)}>Back</button><button className="btn-primary" onClick={() => setStep(2)}>Continue</button></div></div>)}
          {step === 2 && (<div className="space-y-3">
            <div><label className="label">Card number (simulated)</label><input className="input" value="4242 4242 4242 4242" readOnly /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="label">Expiry</label><input className="input" defaultValue="12/29" /></div><div><label className="label">Last 4</label><input className="input" value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} /></div></div>
            <div><label className="label">Coupon code</label><input className="input" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="WELCOME10" /></div>
            <div className="flex gap-2 pt-2"><button className="btn-ghost" onClick={() => setStep(1)}>Back</button><button className="btn-primary" disabled={busy} onClick={place}>{busy ? 'Processing…' : `Pay ${fmt(cart.subtotal + shipping)}`}</button></div>
            <p className="text-xs text-ink-soft">Payments are fully simulated. No real card is charged.</p>
          </div>)}
        </div>
      </div>
      <div className="card h-fit p-6">
        <h2 className="text-lg font-bold">Summary</h2>
        <ul className="mt-3 space-y-2 text-sm">{cart.items.map((i) => <li key={i.productId} className="flex justify-between"><span className="text-ink-soft">{i.name} × {i.quantity}</span><span>{fmt(i.lineTotal)}</span></li>)}</ul>
        <dl className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{fmt(cart.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{shipping === 0 ? 'Free' : fmt(shipping)}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{fmt(cart.subtotal + shipping)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
