import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setToken, getToken } from './api.ts';
import type { User } from './types.ts';

interface AuthCtx {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (d: { email: string; password: string; firstName: string; lastName: string }) => Promise<User>;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try { const r = await api.get<{ user: User }>('/api/auth/me'); setUser(r.user); }
        catch { setToken(null); }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password });
    setToken(r.token); setUser(r.user); return r.user;
  };
  const register = async (d: any) => {
    const r = await api.post<{ token: string; user: User }>('/api/auth/register', d);
    setToken(r.token); setUser(r.user); return r.user;
  };
  const logout = async () => {
    try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
    setToken(null); setUser(null);
  };
  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
