import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Notification } from '@/types';

/** Demo notifications so the bell is populated on first boot. Kept small and
 * generic so the dates/text stay plausible for any demo account. */
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-n1',
    type: 'info',
    title: 'Order shipped',
    message: 'Your order o2 is on its way — tracking CWP2026o2 has been activated.',
    timestamp: new Date(Date.now() - 3 * 86_400_000),
    read: true,
  },
  {
    id: 'demo-n2',
    type: 'success',
    title: 'Order delivered',
    message: 'Order o1 was delivered. We hope you love your new timepiece!',
    timestamp: new Date(Date.now() - 9 * 86_400_000),
    read: true,
  },
  {
    id: 'demo-n3',
    type: 'warning',
    title: 'Back in stock',
    message: 'A watch on your wishlist is back in stock — it will not last long.',
    timestamp: new Date(Date.now() - 1 * 86_400_000),
    read: false,
  },
];

interface NotificationsStore {
  items: Notification[];
  unreadCount: number;
  push: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
}

const recomputeUnread = (state: NotificationsStore): void => {
  state.unreadCount = state.items.filter((item) => !item.read).length;
};

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    immer((set) => ({
      items: DEMO_NOTIFICATIONS,
      unreadCount: DEMO_NOTIFICATIONS.filter((item) => !item.read).length,

      push: (notification) => {
        set((state) => {
          state.items.unshift({
            ...notification,
            id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date(),
            read: false,
          });
          state.items = state.items.slice(0, 50); // cap the feed
          recomputeUnread(state);
        });
      },

      markRead: (id) => {
        set((state) => {
          const item = state.items.find((entry) => entry.id === id);
          if (item && !item.read) {
            item.read = true;
            recomputeUnread(state);
          }
        });
      },

      markAllRead: () => {
        set((state) => {
          state.items.forEach((item) => {
            item.read = true;
          });
          state.unreadCount = 0;
        });
      },

      remove: (id) => {
        set((state) => {
          state.items = state.items.filter((entry) => entry.id !== id);
          recomputeUnread(state);
        });
      },
    })),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** Fire-and-forget push usable outside React (mutations, stores, adapters). */
export const pushNotification = (
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): void => {
  useNotificationsStore.getState().push(notification);
};
