import { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Badge, Empty, Skeleton } from '../components/ui.tsx';

const blank = { title: '', endpoint: '', category: 'Broken Access Control', severity: 'medium', steps: '', impact: '', remediation: '' };
const cats = ['Injection', 'XSS', 'Broken Access Control', 'Authentication', 'Cryptographic Failures', 'CSRF', 'SSRF', 'Business Logic', 'Information Disclosure', 'API Security'];

export default function Findings() {
  const toast = useToast();
  const [findings, setFindings] = useState<any[] | null>(null);
  const [f, setF] = useState<any>(blank);
  const load = () => api.get<any>('/api/findings').then((r) => setFindings(r.findings));
  useEffect(() => { load(); }, []);

  const save = async (status: 'draft' | 'submitted') => {
    try { await api.post('/api/findings', { ...f, status }); toast(status === 'draft' ? 'Draft saved' : 'Finding submitted'); setF(blank); load(); }
    catch (e: any) { toast(e.message ?? 'Could not save', 'error'); }
  };

  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h1 className="text-2xl font-bold">New finding</h1>
        <div className="card mt-4 space-y-3 p-6">
          <div><label className="label">Title</label><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><label className="label">Affected endpoint</label><input className="input font-mono text-sm" value={f.endpoint} onChange={(e) => setF({ ...f, endpoint: e.target.value })} placeholder="GET /labs/..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category</label><select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label">Severity</label><select className="input" value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}>{['info', 'low', 'medium', 'high', 'critical'].map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="label">Reproduction steps</label><textarea className="input h-24" value={f.steps} onChange={(e) => setF({ ...f, steps: e.target.value })} /></div>
          <div><label className="label">Business impact</label><textarea className="input h-20" value={f.impact} onChange={(e) => setF({ ...f, impact: e.target.value })} /></div>
          <div><label className="label">Suggested remediation</label><textarea className="input h-20" value={f.remediation} onChange={(e) => setF({ ...f, remediation: e.target.value })} /></div>
          <div className="flex gap-2"><button className="btn-ghost" onClick={() => save('draft')}>Save draft</button><button className="btn-primary" onClick={() => save('submitted')} disabled={!f.title || !f.steps}>Submit to instructor</button></div>
        </div>
      </div>
      <div className="lg:col-span-2">
        <h2 className="text-lg font-bold">Your findings</h2>
        <div className="mt-4 space-y-2">
          {!findings ? <Skeleton className="h-48" /> : findings.length === 0 ? <Empty title="No findings yet" /> :
            findings.map((x) => <div key={x.id} className="card p-4"><div className="flex items-center justify-between"><span className="font-medium">{x.title}</span><Badge tone={x.status === 'submitted' ? 'green' : 'slate'}>{x.status}</Badge></div><p className="mt-1 text-xs text-ink-soft">{x.category} · {x.severity}</p></div>)}
        </div>
      </div>
    </div>
  );
}
