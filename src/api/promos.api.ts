import api from '@/lib/axios';
import type { PromoCode } from '@/types';

/**
 * Validates a promo code server-side (adapter) against the current subtotal.
 * Rejects with the adapter's user-safe error message on failure.
 */
export const validatePromoCode = async (code: string, subtotal: number): Promise<PromoCode> => {
  const response = await api.get<PromoCode>(
    `/promos/${encodeURIComponent(code.trim())}?subtotal=${Math.max(0, subtotal)}`
  );
  return response.data;
};
