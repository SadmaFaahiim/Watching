import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getApiErrorMessage } from '@/lib/axios';
import type { PaginatedResponse, Review } from '@/types';
import toast from 'react-hot-toast';
import { productKeys } from '@/api/products.api';

export const reviewKeys = {
  all: ['reviews'] as const,
  list: (productId: string | undefined) => [...reviewKeys.all, 'list', productId ?? 'all'] as const,
};

export const useReviews = (productId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: reviewKeys.list(productId),
    enabled: Boolean(productId) && enabled,
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Review>>(
        `/reviews?productId=${productId}&pageSize=100`
      );
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/** Admin moderation view — every review across the catalog. */
export const useAllReviews = () => {
  return useQuery({
    queryKey: reviewKeys.list(undefined),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Review>>('/reviews?pageSize=200');
      return response.data.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

export interface NewReviewInput {
  productId: string;
  rating: number;
  title: string;
  comment: string;
  userId?: string;
  userName?: string;
}

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewReviewInput) => {
      const response = await api.post<{ review: Review }>('/reviews', input);
      return response.data.review;
    },
    onSuccess: (_review, input) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(input.productId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(undefined) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(input.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Thank you — your review has been published.');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to submit your review'));
    },
  });
};

export const useMarkReviewHelpful = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await api.post<{ helpful: number }>(`/reviews/${reviewId}/helpful`);
      return { reviewId, helpful: response.data.helpful };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(undefined) });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: Review) => {
      await api.delete(`/reviews/${review.id}`);
      return review;
    },
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(review.productId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(undefined) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(review.productId) });
      toast.success('Review removed');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to remove the review'));
    },
  });
};
