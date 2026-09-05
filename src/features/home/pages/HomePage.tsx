import { Box } from '@mui/material';
import Hero from '@/features/home/components/Hero';
import Categories from '@/features/home/components/Categories';
import FeaturedProducts from '@/features/home/components/FeaturedProducts';
import LatestProducts from '@/features/home/components/LatestProducts';
import RecentlyViewedProducts from '@/features/home/components/RecentlyViewedProducts';

const HomePage = () => {
  return (
    <Box>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <LatestProducts />
      <RecentlyViewedProducts />
    </Box>
  );
};

export default HomePage;
