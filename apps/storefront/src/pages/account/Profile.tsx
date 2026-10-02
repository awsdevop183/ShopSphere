import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useToast } from '../../components/Toast.tsx';
import { fmt, Skeleton } from '../../components/ui.tsx';

export default function Profile() {
  const toast = useToast();
  const [p, setP] = useState<any>(null);
  useEffect(() => { api.get<any>('/api/account/profile').then((r) => setP(r.profile)); }, []);
  if (!p) return <Skeleton className="h-64" />;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.patch('/api/account/profile', { firstName: p.firstName, lastName: p.lastName, phone: p.profile?.phone }); toast('Profile updated'); }
    catch { toast('Could not save', 'error'); }
  };
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Profile</h1>
      <form onSubmit={save} className="card max-w-lg space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">First name</label><input className="input" value={p.firstName} onChange={(e) => setP({ ...p, firstName: e.target.value })} /></div>
          <div><label className="label">Last name</label><input className="input" value={p.lastName} onChange={(e) => setP({ ...p, lastName: e.target.value })} /></div>
        </div>
        <div><label className="label">Email</label><input className="input bg-slate-50" value={p.email} readOnly /></div>
        <div><label className="label">Phone</label><input className="input" value={p.profile?.phone ?? ''} onChange={(e) => setP({ ...p, profile: { ...p.profile, phone: e.target.value } })} /></div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-soft">Store credit: <b className="text-ink">{fmt(Number(p.profile?.storeCredit ?? 0))}</b></span>
          <button className="btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  );
}
