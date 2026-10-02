import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

type Toast = { id: number; msg: string; kind: 'success' | 'error' | 'info' };
const Ctx = createContext<(msg: string, kind?: Toast['kind']) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const Icon = { success: CheckCircle2, error: XCircle, info: Info };
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => {
          const I = Icon[t.kind];
          return (
            <div key={t.id} className={`card flex items-center gap-2 px-4 py-3 text-sm shadow-lg ring-1 ${t.kind === 'error' ? 'ring-red-200' : t.kind === 'info' ? 'ring-brand-200' : 'ring-green-200'}`}>
              <I className={`h-4 w-4 ${t.kind === 'error' ? 'text-red-500' : t.kind === 'info' ? 'text-brand-500' : 'text-green-500'}`} />
              <span>{t.msg}</span>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
