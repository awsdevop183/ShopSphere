import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { useToast } from '../components/Toast.tsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { const u = await login(email, password); toast(`Welcome back, ${u.firstName}`);
      nav(loc.state?.from ?? (u.role === 'ADMIN' || u.role === 'STAFF' ? '/admin/dashboard' : u.role === 'INSTRUCTOR' ? '/instructor' : '/account')); }
    catch (err: any) { toast(err.message ?? 'Login failed', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-ink-soft">Welcome back to ShopSphere.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-4 text-sm text-ink-soft">No account? <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create one</Link></p>
        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-ink-soft">
          <p className="font-semibold text-ink">Demo accounts</p>
          <p>Customer: avery@example.test / Customer!Pass1</p>
          <p>Admin: admin@shopsphere.test / Admin!Pass123</p>
          <p>Instructor: instructor@shopsphere.test / Teach!Pass123</p>
        </div>
      </div>
    </div>
  );
}
