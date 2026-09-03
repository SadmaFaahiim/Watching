import { Chip } from '@mui/material';
import type { OrderStatus } from '@/types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; color: 'default' | 'info' | 'primary' | 'success' | 'warning' | 'error' }
> = {
  pending: { label: 'Pending', color: 'warning' },
  processing: { label: 'Processing', color: 'info' },
  shipped: { label: 'Shipped', color: 'primary' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const meta = STATUS_META[status];
  return <Chip label={meta.label} color={meta.color} size="small" sx={{ fontWeight: 700 }} />;
};

export default OrderStatusBadge;
