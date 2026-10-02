import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User as UserIcon, Menu, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth.tsx';
import { useCart } from '../lib/cart.tsx';

const nav = [
  { to: '/products', label: 'Shop All' },
  { to: '/deals', label: 'Deals' },
  { to: '/new-arrivals', label: 'New Arrivals' },
  { to: '/best-sellers', label: 'Best Sellers' },
];

export function Header() {
  const { user, logout } = useAuth();
  const { cart, setOpen } = useCart();
  const [q, setQ] = useState('');
  const [mobile, setMobile] = useState(false);
  const navigate = useNavigate();
  const count = cart?.count ?? 0;

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) navigate(`/search?q=${encodeURIComponent(q)}`); };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="bg-brand-600 text-center text-xs font-medium text-white py-1.5">Free shipping on orders over $75 — no code needed</div>
      <div className="container-x flex h-16 items-center gap-4">
        <button className="lg:hidden" onClick={() => setMobile((m) => !m)} aria-label="Menu"><Menu className="h-6 w-6" /></button>
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"><Sparkles className="h-5 w-5" /></span>
          Shop<span className="text-brand-600">Sphere</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 ${isActive ? 'text-brand-700' : 'text-ink'}`}>{n.label}</NavLink>
          ))}
        </nav>
        <form onSubmit={submit} className="relative ml-auto hidden md:block w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="input pl-9" aria-label="Search" />
        </form>
        <div className="flex items-center gap-1 md:ml-2">
          {user ? (
            <div className="group relative">
              <button className="btn-ghost btn-sm"><UserIcon className="h-4 w-4" /><span className="hidden sm:inline">{user.firstName}</span></button>
              <div className="invisible absolute right-0 mt-1 w-52 rounded-xl bg-white p-2 opacity-0 shadow-lg ring-1 ring-slate-100 transition group-hover:visible group-hover:opacity-100">
                <Link to="/account" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">My Account</Link>
                <Link to="/account/orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Orders</Link>
                <Link to="/account/wishlist" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Wishlist</Link>
                {(user.role === 'ADMIN' || user.role === 'STAFF') && <Link to="/admin/dashboard" className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-slate-50">Admin Portal</Link>}
                {user.role === 'INSTRUCTOR' && <Link to="/instructor" className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-slate-50">Instructor Console</Link>}
                <Link to="/labs" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Security Lab</Link>
                <button onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Sign out</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-ghost btn-sm"><UserIcon className="h-4 w-4" /><span className="hidden sm:inline">Sign in</span></Link>
          )}
          <button onClick={() => setOpen(true)} className="relative btn-ghost btn-sm" aria-label="Cart">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{count}</span>}
          </button>
        </div>
      </div>
      {mobile && (
        <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-2">
          {nav.map((n) => <NavLink key={n.to} to={n.to} onClick={() => setMobile(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100">{n.label}</NavLink>)}
        </nav>
      )}
    </header>
  );
}
