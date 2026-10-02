import { useEffect, useState } from 'react';
import { ShieldAlert, RotateCcw, ToggleLeft, ToggleRight, BookOpen, Users } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useToast } from '../../components/Toast.tsx';
import { Badge, Skeleton } from '../../components/ui.tsx';

export default function Instructor() {
  const toast = useToast();
  const [labs, setLabs] = useState<any[] | null>(null);
  const [tab, setTab] = useState<'labs' | 'findings' | 'progress'>('labs');
  const [open, setOpen] = useState<string | null>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);

  const load = () => api.get<any>('/api/instructor/labs').then((r) => setLabs(r.labs));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (tab === 'findings') api.get<any>('/api/instructor/findings').then((r) => setFindings(r.findings));
    if (tab === 'progress') api.get<any>('/api/instructor/progress').then(setProgress);
  }, [tab]);

  const toggle = async (id: string, secure: boolean) => {
    await api.post(`/api/instructor/labs/${id}/mode`, { secure: !secure });
    toast(`Lab switched to ${!secure ? 'secure' : 'vulnerable'} mode`);
    load();
  };
  const reset = async (id: string) => { await api.post(`/api/instructor/labs/${id}/reset`); toast('Lab reset'); };

  return (
    <div className="container-x py-8">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white"><ShieldAlert className="h-6 w-6" /></span>
        <div><h1 className="text-2xl font-bold">VulnForge Instructor Console</h1><p className="text-sm text-ink-soft">Lab catalog, solutions, and student progress. Instructor access only.</p></div>
      </div>
      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {[['labs', 'Lab Catalog', BookOpen], ['findings', 'Student Findings', ShieldAlert], ['progress', 'Progress', Users]].map(([k, l, I]: any) =>
          <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-soft hover:text-ink'}`}><I className="h-4 w-4" /> {l}</button>)}
      </div>

      {tab === 'labs' && (!labs ? <Skeleton className="mt-6 h-96" /> : (
        <div className="mt-6 space-y-3">
          {labs.map((l) => (
            <div key={l.id} className="card overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <button className="flex-1 text-left" onClick={() => setOpen(open === l.id ? null : l.id)}>
                  <div className="flex items-center gap-2"><span className="font-semibold">{l.title}</span><Badge tone="slate">{l.category}</Badge><Badge tone="amber">{l.difficulty}</Badge>{l.secureMode ? <Badge tone="green">secure</Badge> : <Badge tone="red">vulnerable</Badge>}</div>
                  <p className="mt-1 text-sm text-ink-soft">{l.summary}</p>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggle(l.id, l.secureMode)} className="btn-ghost btn-sm" title="Toggle secure/vulnerable">{l.secureMode ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-red-500" />}</button>
                  <button onClick={() => reset(l.id)} className="btn-ghost btn-sm" title="Reset lab data"><RotateCcw className="h-4 w-4" /></button>
                </div>
              </div>
              {open === l.id && (
                <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-4 text-sm">
                  <Field label="Affected endpoint" mono>{l.affectedEndpoint}</Field>
                  <Field label="Root cause">{l.rootCause}</Field>
                  <Field label="Business impact">{l.impact}</Field>
                  <Field label="Reproduction" mono>{l.reproduction}</Field>
                  <Field label="Remediation">{l.remediation}</Field>
                  <Field label="Instructor notes">{l.instructorNotes}</Field>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {tab === 'findings' && (
        <div className="mt-6 space-y-3">
          {findings.length === 0 ? <p className="text-ink-soft">No submitted findings yet.</p> :
            findings.map((f) => <div key={f.id} className="card p-4"><div className="flex items-center gap-2"><span className="font-semibold">{f.title}</span><Badge tone="red">{f.severity}</Badge><Badge tone="slate">{f.category}</Badge></div><p className="mt-1 text-sm text-ink-soft">{f.user?.email} · {f.endpoint}</p><p className="mt-2 text-sm">{f.impact}</p></div>)}
        </div>
      )}

      {tab === 'progress' && (progress ? (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="card p-5"><p className="text-sm text-ink-soft">Students</p><p className="text-2xl font-bold">{progress.students}</p></div>
          <div className="card p-5"><p className="text-sm text-ink-soft">Submitted findings</p><p className="text-2xl font-bold">{progress.submitted}</p></div>
          <div className="card p-5"><p className="text-sm text-ink-soft">Categories covered</p><p className="text-2xl font-bold">{progress.byCategory?.length ?? 0}</p></div>
        </div>
      ) : <Skeleton className="mt-6 h-32" />)}
    </div>
  );
}

function Field({ label, children, mono }: { label: string; children: any; mono?: boolean }) {
  return <div><p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p><p className={`mt-0.5 ${mono ? 'font-mono text-xs bg-white rounded px-2 py-1 ring-1 ring-slate-200' : ''}`}>{children}</p></div>;
}
