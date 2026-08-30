import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  cantidad: number;
  precio_snapshot: number;
  nombre?: string;
  imagen?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, cantidad: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
  setItems: (items: CartItem[]) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (item) => {
        const items = get().items;
        const idx = items.findIndex(i => i.product_id === item.product_id);
        if (idx >= 0) {
          const copy = [...items];
          copy[idx].cantidad += item.cantidad;
          set({ items: copy });
        } else set({ items: [...items, item] });
      },
      removeItem: (id) => set({ items: get().items.filter(i => i.product_id !== id) }),
      updateQty: (id, cantidad) => {
        if (cantidad <= 0) return get().removeItem(id);
        set({ items: get().items.map(i => i.product_id === id ? { ...i, cantidad } : i) });
      },
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((a, b) => a + b.precio_snapshot * b.cantidad, 0),
      count: () => get().items.reduce((a, b) => a + b.cantidad, 0),
    }),
    { name: 'dulce-cart' }
  )
);
