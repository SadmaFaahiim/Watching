import type { Product, SortOption } from '@/types';

export const PRODUCT_CATEGORIES: { value: Product['category']; label: string }[] = [
  { value: 'luxury', label: 'Luxury' },
  { value: 'sport', label: 'Sport' },
  { value: 'casual', label: 'Casual' },
  { value: 'smart', label: 'Smart' },
  { value: 'classic', label: 'Classic' },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'name-az', label: 'Name: A to Z' },
  { value: 'name-za', label: 'Name: Z to A' },
];

export const DEFAULT_PRICE_RANGE: [number, number] = [0, 50000];
export const PRICE_SLIDER_STEP = 100;
export const PRODUCTS_PAGE_SIZE = 12;
