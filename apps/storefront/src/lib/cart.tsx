import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api.ts';
import { useAuth } from './auth.tsx';
import type { CartView } from './types.ts';

interface CartCtx {
  cart: CartView | null; open: boolean; setOpen: (o: boolean) => void;
  refresh: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
}
const Ctx = createContext<CartCtx>(null as any);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartView | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    if (!user) { setCart(null); return; }
    try { setCart(await api.get<CartView>('/api/shop/cart')); } catch { /* ignore */ }
  };
  useEffect(() => { refresh(); }, [user]);

  const add = async (productId: string, quantity = 1) => { setCart(await api.post<CartView>('/api/shop/cart/items', { productId, quantity })); setOpen(true); };
  const update = async (productId: string, quantity: number) => { setCart(await api.patch<CartView>(`/api/shop/cart/items/${productId}`, { quantity })); };
  const remove = async (productId: string) => { setCart(await api.del<CartView>(`/api/shop/cart/items/${productId}`)); };

  return <Ctx.Provider value={{ cart, open, setOpen, refresh, add, update, remove }}>{children}</Ctx.Provider>;
}
