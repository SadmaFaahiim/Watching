import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Product } from '@/types';

const MAX_RECENT = 10;

interface RecentlyViewedStore {
  items: Product[];
  /** Records a product view (newest first, deduped, capped). */
  record: (product: Product) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    immer((set) => ({
      items: [],

      record: (product) => {
        set((state) => {
          state.items = [product, ...state.items.filter((item) => item.id !== product.id)].slice(
            0,
            MAX_RECENT
          );
        });
      },

      clear: () => {
        set({ items: [] });
      },
    })),
    {
      name: 'recently-viewed-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
