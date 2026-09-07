import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { Star, Watch } from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency, calculateDiscount } from '@/utils/helpers';

interface QuickViewDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

const QuickViewDialog = ({ product, open, onClose }: QuickViewDialogProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const outOfStock = product.stock <= 0;
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? calculateDiscount(product.originalPrice, product.price)
      : product.discount;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem(product);
    toast.success(`${product.name} added to cart`);
    onClose();
  };

  const goToDetail = () => {
    onClose();
    navigate(`/products/${product.id}`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '16 / 10',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Watch sx={{ fontSize: 80, color: 'text.disabled' }} />
          )}
          {discount ? (
            <Chip
              label={`-${discount}%`}
              color="error"
              size="small"
              sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }}
            />
          ) : null}
        </Box>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            textTransform="uppercase"
          >
            {product.brand} · {product.category}
          </Typography>
          <Typography variant="h5" component="h2" fontWeight={700} sx={{ mt: 0.25 }}>
            {product.name}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
            <Star sx={{ fontSize: 18, color: 'warning.main' }} />
            <Typography variant="body2" fontWeight={600}>
              {product.rating > 0 ? product.rating.toFixed(1) : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 1 }}>
            <Typography variant="h6" component="div" fontWeight={800} color="primary.main">
              {formatCurrency(product.price)}
            </Typography>
            {product.originalPrice && product.originalPrice > product.price && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatCurrency(product.originalPrice)}
              </Typography>
            )}
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Case: {product.specifications.caseDiameter} · {product.specifications.caseMaterial}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Movement: {product.specifications.movement}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              onClick={handleAddToCart}
              disabled={outOfStock}
              sx={{ flexGrow: 1 }}
            >
              {outOfStock ? 'Out of stock' : 'Add to Cart'}
            </Button>
            <Button variant="outlined" onClick={goToDetail} sx={{ flexGrow: 1 }}>
              View full details
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewDialog;
