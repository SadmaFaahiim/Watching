import { Box } from '@mui/material';
import { lazy, Suspense } from 'react';
import Hero from '@/features/home/components/Hero';
import LoadingScreen from '@/components/common/LoadingScreen';

const Categories = lazy(() => import('@/features/home/components/Categories'));
const FeaturedProducts = lazy(() => import('@/features/home/components/FeaturedProducts'));
const LatestProducts = lazy(() => import('@/features/home/components/LatestProducts'));

const HomePage = () => {
  return (
    <Box>
      <Hero />
      <Suspense fallback={<LoadingScreen />}>
        <Categories />
        <FeaturedProducts />
        <LatestProducts />
      </Suspense>
    </Box>
  );
};

export default HomePage;