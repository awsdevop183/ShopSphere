import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../lib/cart.tsx';
import { useAuth } from '../lib/auth.tsx';
import { fmt, Empty } from '../components/ui.tsx';

export default function Cart() {
  const { cart, update, remove } = useCart();
  const { user } = useAuth();
  if (!user) return <div className="container-x py-10"><Empty title="Sign in to view your cart" ><Link to="/login" className="btn-primary mt-4">Sign in</Link></Empty></div>;
  if (!cart || cart.items.length === 0) return <div className="container-x py-10"><Empty title="Your cart is empty" hint="Discover something you'll love."><Link to="/products" className="btn-primary mt-4">Browse products</Link></Empty></div>;
  const shipping = cart.subtotal >= 75 ? 0 : 6.99;
  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        {cart.items.map((i) => (
          <div key={i.productId} className="card flex items-center gap-4 p-4">
            <img src={i.image ?? ''} alt={i.name} className="h-20 w-20 rounded-lg object-cover bg-slate-100" />
            <div className="flex-1"><Link to={`/products/${i.slug}`} className="font-semibold hover:text-brand-700">{i.name}</Link><p className="text-sm text-ink-soft">{fmt(i.unitPrice)}</p></div>
            <input type="number" min={1} max={20} value={i.quantity} onChange={(e) => update(i.productId, Math.max(1, Math.min(20, Number(e.target.value))))} className="input w-20" />
            <div className="w-20 text-right font-semibold">{fmt(i.lineTotal)}</div>
            <button onClick={() => remove(i.productId)} className="text-red-500 hover:text-red-700"><Trash2 className="h-5 w-5" /></button>
          </div>
        ))}
      </div>
      <div className="card h-fit p-6">
        <h2 className="text-lg font-bold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{fmt(cart.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{shipping === 0 ? 'Free' : fmt(shipping)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><dt>Total</dt><dd>{fmt(cart.subtotal + shipping)}</dd></div>
        </dl>
        <Link to="/checkout" className="btn-primary mt-6 w-full">Proceed to checkout</Link>
      </div>
    </div>
  );
}
