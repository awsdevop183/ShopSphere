import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useToast } from '../../components/Toast.tsx';
import { Badge, Empty, Skeleton } from '../../components/ui.tsx';

export default function Support() {
  const toast = useToast();
  const [tickets, setTickets] = useState<any[] | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const load = () => api.get<any>('/api/account/support').then((r) => setTickets(r.tickets));
  useEffect(() => { load(); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/api/account/support', { subject, body }); toast('Ticket submitted'); setSubject(''); setBody(''); load(); }
    catch { toast('Could not submit', 'error'); }
  };
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Support</h1>
      <form onSubmit={submit} className="card space-y-3 p-6">
        <div><label className="label">Subject</label><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required /></div>
        <div><label className="label">Message</label><textarea className="input h-28" value={body} onChange={(e) => setBody(e.target.value)} required /></div>
        <button className="btn-primary">Submit ticket</button>
      </form>
      <h2 className="mb-2 mt-6 font-semibold">Your tickets</h2>
      {!tickets ? <Skeleton className="h-24" /> : tickets.length === 0 ? <Empty title="No tickets yet" /> :
        <div className="space-y-2">{tickets.map((t) => <div key={t.id} className="card flex items-center justify-between p-4"><span className="font-medium">{t.subject}</span><Badge tone="brand">{t.status}</Badge></div>)}</div>}
    </div>
  );
}
