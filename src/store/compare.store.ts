import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Product } from '@/types';

const MAX_COMPARE = 4;

interface CompareStore {
  items: Product[];
  drawerOpen: boolean;
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    immer((set, get) => ({
      items: [],
      drawerOpen: false,

      toggle: (product) => {
        const exists = get().items.some((item) => item.id === product.id);
        if (exists) {
          set((state) => {
            state.items = state.items.filter((item) => item.id !== product.id);
          });
          return;
        }
        if (get().items.length >= MAX_COMPARE) {
          return;
        }
        set((state) => {
          state.items.push(product);
        });
        // Opening the drawer right after a toggle shows the added piece.
        set({ drawerOpen: true });
      },

      remove: (productId) => {
        set((state) => {
          state.items = state.items.filter((item) => item.id !== productId);
        });
      },

      clear: () => {
        set({ items: [] });
      },

      openDrawer: () => {
        set({ drawerOpen: true });
      },

      closeDrawer: () => {
        set({ drawerOpen: false });
      },
    })),
    {
      name: 'compare-storage',
      storage: createJSONStorage(() => localStorage),
      // The open/closed state of the drawer is transient — never persist it.
      partialize: (state) => ({ items: state.items }),
    }
  )
);
