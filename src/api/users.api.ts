import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getApiErrorMessage } from '@/lib/axios';
import type { User } from '@/types';
import toast from 'react-hot-toast';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: () => [...userKeys.lists(), {}] as const,
};

// Fetch all users (Admin)
export const useUsers = (enabled = true) => {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async () => {
      const response = await api.get<User[]>('/users');
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled,
  });
};

// Update a user (Admin — role changes etc.)
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<User> & { id: string }) => {
      const response = await api.patch<User>(`/users/${id}`, patch);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to update user'));
    },
  });
};
