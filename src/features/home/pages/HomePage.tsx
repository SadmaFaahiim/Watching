import { Box } from '@mui/material';
import { lazy, Suspense } from 'react';
import Hero from '@/features/home/components/Hero';
import LoadingScreen from '@/components/common/LoadingScreen';

// Rails below the fold load lazily so the hero paints without waiting on
// them (perf pass); the recently-viewed rail is empty for first-time
// visitors, so it joins the same lazy boundary.
const Categories = lazy(() => import('@/features/home/components/Categories'));
const FeaturedProducts = lazy(() => import('@/features/home/components/FeaturedProducts'));
const LatestProducts = lazy(() => import('@/features/home/components/LatestProducts'));
const RecentlyViewedProducts = lazy(
  () => import('@/features/home/components/RecentlyViewedProducts')
);

const HomePage = () => {
  return (
    <Box>
      <Hero />
      <Suspense fallback={<LoadingScreen />}>
        <Categories />
        <FeaturedProducts />
        <LatestProducts />
        <RecentlyViewedProducts />
      </Suspense>
    </Box>
  );
};

export default HomePage;