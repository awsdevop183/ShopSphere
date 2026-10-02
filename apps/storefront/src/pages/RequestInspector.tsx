import { useState } from 'react';
import { getToken } from '../lib/api.ts';

// Local, bounded request inspector. Allows only GET/POST to same-origin
// /labs/* and /api/* paths — not an arbitrary proxy or URL fetcher.
export default function RequestInspector() {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/labs/sqli-search/?q=lamp');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  const send = async () => {
    setErr(''); setResult(null);
    if (!/^\/(labs|api)\//.test(path)) { setErr('Only same-origin /labs/* and /api/* paths are allowed.'); return; }
    const t0 = performance.now();
    try {
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
        body: method !== 'GET' && body ? body : undefined,
      });
      const text = await res.text();
      setResult({
        status: res.status, ms: Math.round(performance.now() - t0),
        headers: Object.fromEntries([...res.headers.entries()].filter(([k]) => !/set-cookie/i.test(k))),
        body: text.slice(0, 20000),
      });
    } catch (e: any) { setErr(String(e.message)); }
  };

  return (
    <div className="container-x py-8">
      <h1 className="text-2xl font-bold">Request Inspector</h1>
      <p className="mt-1 text-sm text-ink-soft">Send bounded requests to <code className="rounded bg-slate-100 px-1">/labs/*</code> and <code className="rounded bg-slate-100 px-1">/api/*</code> and inspect the response.</p>
      <div className="card mt-6 p-4">
        <div className="flex gap-2">
          <select className="input w-28" value={method} onChange={(e) => setMethod(e.target.value)}><option>GET</option><option>POST</option><option>PATCH</option><option>DELETE</option></select>
          <input className="input flex-1 font-mono text-sm" value={path} onChange={(e) => setPath(e.target.value)} />
          <button className="btn-primary" onClick={send}>Send</button>
        </div>
        {method !== 'GET' && <textarea className="input mt-3 h-24 font-mono text-sm" value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"key":"value"}' />}
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      </div>
      {result && (
        <div className="card mt-4 p-4">
          <div className="flex items-center gap-3 text-sm"><span className={`chip ${result.status < 400 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{result.status}</span><span className="text-ink-soft">{result.ms} ms</span></div>
          <p className="mt-3 text-xs font-bold uppercase text-ink-soft">Response headers</p>
          <pre className="mt-1 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(result.headers, null, 2)}</pre>
          <p className="mt-3 text-xs font-bold uppercase text-ink-soft">Response body</p>
          <pre className="mt-1 max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{result.body}</pre>
        </div>
      )}
    </div>
  );
}
