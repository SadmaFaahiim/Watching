import { useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Favorite, FavoriteBorder, Star, Watch } from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { formatCurrency, calculateDiscount } from '@/utils/helpers';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  // Subscribe to changing data, not stable action/method references — with
  // useSyncExternalStore, a selector returning a stable reference (e.g. a
  // store method) never re-renders when the store changes.
  const wishlistItems = useWishlistStore((state) => state.items);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  const [imageFailed, setImageFailed] = useState(false);

  const outOfStock = product.stock <= 0;
  const wished = wishlistItems.some((item) => item.productId === product.id);
  const detailPath = `/products/${product.id}`;

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? calculateDiscount(product.originalPrice, product.price)
      : product.discount;

  const handleAddToCart = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (outOfStock) return;
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (wished) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product.id);
      toast.success('Added to wishlist');
    }
  };

  const showImage = Boolean(product.thumbnail) && !imageFailed;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* Media area */}
      <Box sx={{ position: 'relative', aspectRatio: '1 / 1', bgcolor: 'action.hover' }}>
        <CardActionArea
          component="a"
          href={detailPath}
          sx={{ width: '100%', height: '100%' }}
          onClick={(event) => {
            event.preventDefault();
            navigate(detailPath);
          }}
        >
          {showImage ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #3867D6 0%, #2849A5 100%)',
              }}
            >
              <Watch sx={{ fontSize: 72, color: 'rgba(255,255,255,0.85)' }} />
            </Box>
          )}
        </CardActionArea>

        {/* Badges */}
        <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 8, left: 8 }}>
          {typeof discount === 'number' && discount > 0 && (
            <Chip label={`-${discount}%`} size="small" color="error" sx={{ fontWeight: 700 }} />
          )}
          {product.isNew && !discount && (
            <Chip label="New" size="small" color="success" sx={{ fontWeight: 700 }} />
          )}
        </Stack>

        {/* Wishlist */}
        <Tooltip title={wished ? 'Remove from wishlist' : 'Add to wishlist'}>
          <IconButton
            onClick={handleToggleWishlist}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            size="small"
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {wished ? (
              <Favorite color="error" fontSize="small" />
            ) : (
              <FavoriteBorder fontSize="small" />
            )}
          </IconButton>
        </Tooltip>

        {outOfStock && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.45)',
            }}
          >
            <Chip
              label="Out of stock"
              color="default"
              sx={{ bgcolor: 'background.paper', fontWeight: 700 }}
            />
          </Box>
        )}
      </Box>

      {/* Details */}
      <CardContent
        sx={{
          pt: 1.5,
          pb: 2,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          cursor: 'pointer',
          '&:last-child': { pb: 2 },
        }}
        onClick={() => navigate(detailPath)}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          textTransform="uppercase"
          fontWeight={600}
        >
          {product.brand}
        </Typography>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          lineHeight={1.3}
          className="line-clamp-2"
          title={product.name}
        >
          {product.name}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Star sx={{ fontSize: 16, color: 'warning.main' }} />
          <Typography variant="body2" fontWeight={600}>
            {product.rating > 0 ? product.rating.toFixed(1) : '—'}
          </Typography>
          {product.reviewCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              ({product.reviewCount})
            </Typography>
          )}
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            {formatCurrency(product.price)}
          </Typography>
          {product.originalPrice && product.originalPrice > product.price && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textDecoration: 'line-through' }}
            >
              {formatCurrency(product.originalPrice)}
            </Typography>
          )}
        </Stack>

        <Button
          variant="contained"
          fullWidth
          disabled={outOfStock}
          onClick={handleAddToCart}
          sx={{ mt: 1 }}
        >
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
