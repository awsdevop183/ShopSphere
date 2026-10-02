import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const cols = [
  { h: 'Shop', links: [['All Products', '/products'], ['Deals', '/deals'], ['New Arrivals', '/new-arrivals'], ['Best Sellers', '/best-sellers']] },
  { h: 'Support', links: [['Help Center', '/help'], ['Shipping', '/shipping'], ['Returns', '/returns'], ['Track Order', '/track-order'], ['Contact', '/contact']] },
  { h: 'Company', links: [['About', '/about'], ['FAQ', '/faq'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-x grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"><Sparkles className="h-5 w-5" /></span>
            ShopSphere
          </Link>
          <p className="mt-3 text-sm text-ink-soft">Everything you need, delivered.</p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <h4 className="text-sm font-semibold">{c.h}</h4>
            <ul className="mt-3 space-y-2">
              {c.links.map(([l, to]) => <li key={to}><Link to={to} className="text-sm text-ink-soft hover:text-brand-700">{l}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-ink-soft">
        © 2026 ShopSphere (fictional). A synthetic training environment. No real products, payments, or customers.
      </div>
    </footer>
  );
}
