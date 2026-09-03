import type { OrderStatus, PaymentStatus } from '@/types';

export const ORDER_FLOW: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const PAYMENT_META: Record<
  PaymentStatus,
  { label: string; color: 'default' | 'success' | 'warning' | 'error' }
> = {
  pending: { label: 'Payment pending', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  failed: { label: 'Payment failed', color: 'error' },
  refunded: { label: 'Refunded', color: 'default' },
};
