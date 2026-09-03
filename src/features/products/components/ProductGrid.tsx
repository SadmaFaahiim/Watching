import { Grid } from '@mui/material';
import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  spacing?: number;
}

const ProductGrid = ({ products, spacing }: ProductGridProps) => {
  return (
    <Grid container spacing={spacing ?? { xs: 2, sm: 3 }}>
      {products.map((product) => (
        <Grid item key={product.id} xs={6} sm={4} lg={3}>
          <ProductCard product={product} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductGrid;
