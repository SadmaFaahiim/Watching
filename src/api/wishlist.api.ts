import { useQueries } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Product } from '@/types';
import { productKeys } from '@/api/products.api';

const fetchProduct = async (id: string): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
};

// Resolve a list of wishlist product ids into full product records.
// Each id is fetched independently so a single deleted/unknown id fails
// gracefully instead of breaking the whole list.
export const useWishlistProducts = (productIds: string[]) => {
  const queries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: productKeys.detail(id),
      queryFn: () => fetchProduct(id),
      staleTime: 1000 * 60 * 10,
      retry: 0,
    })),
  });

  const isLoading = queries.some((query) => query.isLoading);
  const products = queries
    .map((query) => query.data)
    .filter((product): product is Product => Boolean(product));

  return { products, isLoading };
};
