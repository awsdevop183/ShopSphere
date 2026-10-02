import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, ArrowLeft } from 'lucide-react';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/customers', label: 'Customers', icon: Users },
];
export default function AdminLayout() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
        <p className="px-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Administration</p>
        <nav className="mt-3 space-y-1">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-100'}`}><l.icon className="h-4 w-4" /> {l.label}</NavLink>)}
        </nav>
        <Link to="/" className="mt-6 flex items-center gap-2 px-3 text-sm text-ink-soft hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> Back to store</Link>
      </aside>
      <div className="flex-1 bg-slate-50 p-6"><Outlet /></div>
    </div>
  );
}
