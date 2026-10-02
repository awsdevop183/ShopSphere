import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { useToast } from '../components/Toast.tsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await register(f); toast('Account created!'); nav('/account'); }
    catch (err: any) {
      const issues = err.body?.issues?.fieldErrors;
      toast(issues ? Object.values(issues).flat()[0] as string : err.message ?? 'Registration failed', 'error');
    } finally { setBusy(false); }
  };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-ink-soft">Join ShopSphere in seconds.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First name</label><input className="input" value={f.firstName} onChange={set('firstName')} required /></div>
            <div><label className="label">Last name</label><input className="input" value={f.lastName} onChange={set('lastName')} required /></div>
          </div>
          <div><label className="label">Email</label><input className="input" type="email" value={f.email} onChange={set('email')} required /></div>
          <div><label className="label">Password</label><input className="input" type="password" value={f.password} onChange={set('password')} required />
            <p className="mt-1 text-xs text-ink-soft">At least 10 characters with upper, lower, and a digit.</p></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="mt-4 text-sm text-ink-soft">Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
