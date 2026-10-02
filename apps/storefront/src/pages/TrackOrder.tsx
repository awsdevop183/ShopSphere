import { useState } from 'react';
import { Package } from 'lucide-react';
export default function TrackOrder() {
  const [num, setNum] = useState('');
  const [result, setResult] = useState<string | null>(null);
  return (
    <div className="container-x max-w-xl py-16">
      <h1 className="text-2xl font-bold">Track your order</h1>
      <p className="mt-1 text-sm text-ink-soft">Enter your order number (e.g. SS-2026-10000).</p>
      <div className="mt-6 flex gap-2">
        <input className="input" value={num} onChange={(e) => setNum(e.target.value)} placeholder="SS-2026-10000" />
        <button className="btn-primary" onClick={() => setResult(num ? `Order ${num} is in transit · estimated delivery in 2 days.` : null)}>Track</button>
      </div>
      {result && <div className="card mt-6 flex items-center gap-3 p-4"><Package className="h-6 w-6 text-brand-600" /><p className="text-sm">{result}</p></div>}
    </div>
  );
}
