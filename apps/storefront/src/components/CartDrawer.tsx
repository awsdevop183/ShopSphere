import { Link } from 'react-router-dom';
import { X, Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from '../lib/cart.tsx';
import { fmt, Empty } from './ui.tsx';

export function CartDrawer() {
  const { cart, open, setOpen, update, remove } = useCart();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold">Your Cart {cart?.count ? `(${cart.count})` : ''}</h2>
          <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {!cart || cart.items.length === 0 ? (
            <Empty title="Your cart is empty" hint="Browse the catalog and add something you love." />
          ) : (
            <ul className="space-y-4">
              {cart.items.map((i) => (
                <li key={i.productId} className="flex gap-3">
                  <img src={i.image ?? ''} alt={i.name} className="h-20 w-20 rounded-lg object-cover bg-slate-100" />
                  <div className="flex-1">
                    <p className="font-medium leading-tight">{i.name}</p>
                    <p className="text-sm text-ink-soft">{fmt(i.unitPrice)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button className="btn-ghost btn-sm !px-2" onClick={() => update(i.productId, Math.max(1, i.quantity - 1))}><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center text-sm">{i.quantity}</span>
                      <button className="btn-ghost btn-sm !px-2" onClick={() => update(i.productId, i.quantity + 1)}><Plus className="h-3 w-3" /></button>
                      <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => remove(i.productId)} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="font-semibold">{fmt(i.lineTotal)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cart && cart.items.length > 0 && (
          <div className="border-t border-slate-200 p-5">
            <div className="mb-3 flex justify-between text-sm"><span>Subtotal</span><span className="font-bold">{fmt(cart.subtotal)}</span></div>
            <Link to="/checkout" onClick={() => setOpen(false)} className="btn-primary w-full">Checkout</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
