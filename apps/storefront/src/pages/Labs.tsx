import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Notebook, Radio, Target } from 'lucide-react';
import { api } from '../lib/api.ts';
import { Badge, Skeleton } from '../components/ui.tsx';

// Student-facing lab discovery. Shows ONLY business context + endpoint —
// no root cause, no solution. Students investigate independently.
export default function Labs() {
  const [labs, setLabs] = useState<any[] | null>(null);
  useEffect(() => { api.get<any>('/labs/').then((r) => setLabs(r.labs)); }, []);
  return (
    <div className="container-x py-8">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white"><Target className="h-6 w-6" /></span>
        <div><h1 className="text-2xl font-bold">Security Lab</h1><p className="text-sm text-ink-soft">Authorized testing scope. Investigate the features below and document what you find.</p></div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link to="/labs/findings" className="card flex items-center gap-3 p-5 hover:shadow-md"><Notebook className="h-6 w-6 text-brand-600" /><div><p className="font-semibold">Finding notebook</p><p className="text-xs text-ink-soft">Draft & submit your findings</p></div></Link>
        <Link to="/labs/inspector" className="card flex items-center gap-3 p-5 hover:shadow-md"><Radio className="h-6 w-6 text-brand-600" /><div><p className="font-semibold">Request inspector</p><p className="text-xs text-ink-soft">Inspect requests & responses</p></div></Link>
        <div className="card flex items-center gap-3 p-5"><FlaskConical className="h-6 w-6 text-brand-600" /><div><p className="font-semibold">{labs?.length ?? '…'} target features</p><p className="text-xs text-ink-soft">All data is synthetic</p></div></div>
      </div>

      <div className="card mt-6 border-l-4 border-l-amber-400 p-4 text-sm">
        <p className="font-semibold">Rules of engagement</p>
        <p className="mt-1 text-ink-soft">Test only the endpoints under <code className="rounded bg-slate-100 px-1">/labs/*</code>. All accounts and data are fictional. Do not attack the trusted platform (auth, admin, instructor console) — those are out of scope and hardened.</p>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Target features</h2>
      {!labs ? <Skeleton className="h-96" /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {labs.map((l) => (
            <div key={l.id} className="card p-4">
              <div className="flex items-center justify-between"><span className="font-semibold">{l.title}</span><Badge tone="slate">{l.difficulty}</Badge></div>
              <p className="mt-1 text-sm text-ink-soft">{l.summary}</p>
              <p className="mt-2 font-mono text-xs text-brand-700">{l.affectedEndpoint}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
