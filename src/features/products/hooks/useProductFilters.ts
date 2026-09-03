import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductFilters as ProductFiltersType, SortOption } from '@/types';
import { DEFAULT_PRICE_RANGE } from '@/features/products/constants';

const SORT_VALUES: SortOption[] = [
  'newest',
  'price-low',
  'price-high',
  'rating',
  'popular',
  'name-az',
  'name-za',
];

const parseNumber = (value: string | null): number | undefined => {
  if (value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildParams = (
  filters: ProductFiltersType,
  sort: SortOption,
  page: number
): URLSearchParams => {
  const params = new URLSearchParams();

  if (filters.category && filters.category.length > 0) {
    params.set('category', filters.category.join(','));
  }
  if (filters.priceRange) {
    params.set('minPrice', String(filters.priceRange[0]));
    params.set('maxPrice', String(filters.priceRange[1]));
  }
  if (filters.rating !== undefined) {
    params.set('rating', String(filters.rating));
  }
  if (filters.inStock) {
    params.set('inStock', 'true');
  }
  if (sort !== 'newest') {
    params.set('sort', sort);
  }
  if (page > 1) {
    params.set('page', String(page));
  }

  return params;
};

export const useProductFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<ProductFiltersType>(() => {
    const next: ProductFiltersType = {};

    const categories = searchParams.get('category');
    if (categories) {
      const list = categories
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (list.length > 0) {
        next.category = list;
      }
    }

    const minPrice = parseNumber(searchParams.get('minPrice'));
    const maxPrice = parseNumber(searchParams.get('maxPrice'));
    const low = minPrice ?? DEFAULT_PRICE_RANGE[0];
    const high = maxPrice ?? DEFAULT_PRICE_RANGE[1];
    if (low < high) {
      next.priceRange = [low, high];
    }

    const rating = parseNumber(searchParams.get('rating'));
    if (rating !== undefined && rating >= 1 && rating <= 5) {
      next.rating = rating;
    }

    if (searchParams.get('inStock') === 'true') {
      next.inStock = true;
    }

    return next;
  }, [searchParams]);

  const sort = useMemo<SortOption>(() => {
    const value = searchParams.get('sort');
    return value && SORT_VALUES.includes(value as SortOption) ? (value as SortOption) : 'newest';
  }, [searchParams]);

  const page = useMemo<number>(() => {
    const parsed = Number(searchParams.get('page') ?? '1');
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);

  const write = (nextFilters: ProductFiltersType, nextSort: SortOption, nextPage: number) => {
    const params = buildParams(nextFilters, nextSort, nextPage);
    // Preserve an active search query if present
    const query = searchParams.get('q');
    if (query) {
      params.set('q', query);
    }
    setSearchParams(params, { replace: true });
  };

  const updateFilters = (nextFilters: ProductFiltersType) => {
    write(nextFilters, sort, 1);
  };

  const updateSort = (nextSort: SortOption) => {
    write(filters, nextSort, 1);
  };

  const setPage = (nextPage: number) => {
    write(filters, sort, nextPage);
  };

  const clearFilters = () => {
    write({}, 'newest', 1);
  };

  return { filters, sort, page, updateFilters, updateSort, setPage, clearFilters };
};
