import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Cart, CartItem, Product, PromoCode } from '@/types';
import { discountForPromo } from '@/mocks/adapter';

interface CartStore extends Cart {
  /** The promo code applied to the cart, when one is active. */
  promoCode: string | null;
  /** The validated promo definition backing `promoCode` (used to recompute the
   * discount whenever the subtotal changes). */
  appliedPromo: PromoCode | null;
  /** Current promo discount on the subtotal (0 when none is applied). */
  discount: number;
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: string) => CartItem | undefined;
  calculateTotal: () => void;
  applyPromoCode: (promo: PromoCode) => void;
  removePromoCode: () => void;
}

/** Recomputes counts, subtotal and (promo) discount for the current items. */
const recompute = (state: CartStore): void => {
  state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  state.total = state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  state.discount = state.appliedPromo ? discountForPromo(state.appliedPromo, state.total) : 0;
};

export const useCartStore = create<CartStore>()(
  persist(
    immer((set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      promoCode: null,
      appliedPromo: null,
      discount: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.productId === product.id);

          if (existingItem) {
            // Update quantity if item already exists
            existingItem.quantity += quantity;
          } else {
            // Add new item
            state.items.push({
              productId: product.id,
              quantity,
              product,
            });
          }

          recompute(state);
        });
      },

      removeItem: (productId) => {
        set((state) => {
          state.items = state.items.filter((item) => item.productId !== productId);
          recompute(state);
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const item = state.items.find((item) => item.productId === productId);
          if (item) {
            item.quantity = quantity;
            recompute(state);
          }
        });
      },

      clearCart: () => {
        set({
          items: [],
          total: 0,
          itemCount: 0,
          promoCode: null,
          appliedPromo: null,
          discount: 0,
        });
      },

      getItem: (productId) => {
        return get().items.find((item) => item.productId === productId);
      },

      calculateTotal: () => {
        set((state) => {
          recompute(state);
        });
      },

      applyPromoCode: (promo) => {
        set((state) => {
          state.appliedPromo = promo;
          state.promoCode = promo.code;
          state.discount = state.appliedPromo
            ? discountForPromo(state.appliedPromo, state.total)
            : 0;
        });
      },

      removePromoCode: () => {
        set({
          promoCode: null,
          appliedPromo: null,
          discount: 0,
        });
      },
    })),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
