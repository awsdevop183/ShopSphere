import { NavLink, Outlet } from 'react-router-dom';
import { User, Package, Heart, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../lib/auth.tsx';

const links = [
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/support', label: 'Support', icon: LifeBuoy },
];
export default function AccountLayout() {
  const { user } = useAuth();
  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <div className="card p-4">
          <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-ink-soft">{user?.email}</p>
        </div>
        <nav className="mt-4 space-y-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}`}>
              <l.icon className="h-4 w-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:col-span-3"><Outlet /></div>
    </div>
  );
}
