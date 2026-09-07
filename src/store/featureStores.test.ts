import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationsStore } from '@/store/notifications.store';
import { useRecentlyViewedStore } from '@/store/recentlyViewed.store';
import { useCompareStore } from '@/store/compare.store';
import { makeProduct } from '@/test/factories';

describe('notifications store', () => {
  beforeEach(() => {
    localStorage.clear();
    useNotificationsStore.setState({ items: [], unreadCount: 0 });
  });

  it('seeds demo notifications on first boot and pushes new ones unread', () => {
    useNotificationsStore.setState({
      items: [
        {
          id: 'n1',
          type: 'info',
          title: 'Order shipped',
          message: 'o2 on its way',
          timestamp: new Date(),
          read: true,
        },
      ],
      unreadCount: 0,
    });
    useNotificationsStore.getState().push({
      type: 'success',
      title: 'Order placed',
      message: 'Order o9 placed',
    });

    const state = useNotificationsStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.items[0].title).toBe('Order placed');
    expect(state.items[0].read).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it('marks a single notification read and all read', () => {
    useNotificationsStore.getState().push({ type: 'warning', title: 'Low stock', message: 'x' });
    useNotificationsStore.getState().push({ type: 'error', title: 'Failed', message: 'y' });
    expect(useNotificationsStore.getState().unreadCount).toBe(2);

    useNotificationsStore.getState().markRead(useNotificationsStore.getState().items[0].id);
    expect(useNotificationsStore.getState().unreadCount).toBe(1);

    useNotificationsStore.getState().markAllRead();
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
    expect(useNotificationsStore.getState().items.every((item) => item.read)).toBe(true);
  });

  it('removes a notification', () => {
    useNotificationsStore.getState().push({ type: 'info', title: 'T', message: 'M' });
    const id = useNotificationsStore.getState().items[0].id;
    useNotificationsStore.getState().remove(id);
    expect(useNotificationsStore.getState().items).toHaveLength(0);
  });
});

describe('recently-viewed store', () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentlyViewedStore.setState({ items: [] });
  });

  it('records newest-first without duplicates', () => {
    const first = makeProduct({ id: 'p1', name: 'First' });
    const second = makeProduct({ id: 'p2', name: 'Second' });
    const { record } = useRecentlyViewedStore.getState();
    record(first);
    record(second);
    record(first); // Re-viewing p1 moves it to the front instead of duplicating.

    const items = useRecentlyViewedStore.getState().items;
    expect(items.map((item) => item.id)).toEqual(['p1', 'p2']);
  });

  it('caps the rail at ten entries and clears', () => {
    const { record } = useRecentlyViewedStore.getState();
    for (let index = 0; index < 12; index += 1) {
      record(makeProduct({ id: `p${index}`, name: `Watch ${index}` }));
    }
    const items = useRecentlyViewedStore.getState().items;
    expect(items).toHaveLength(10);
    expect(items[0].id).toBe('p11');

    useRecentlyViewedStore.getState().clear();
    expect(useRecentlyViewedStore.getState().items).toHaveLength(0);
  });
});

describe('compare store', () => {
  beforeEach(() => {
    localStorage.clear();
    useCompareStore.setState({ items: [], drawerOpen: false });
  });

  it('toggles products in and out and opens the drawer on add', () => {
    const product = makeProduct({ id: 'p1', name: 'Diver' });
    useCompareStore.getState().toggle(product);
    expect(useCompareStore.getState().items.map((item) => item.id)).toEqual(['p1']);
    expect(useCompareStore.getState().drawerOpen).toBe(true);

    useCompareStore.getState().toggle(product);
    expect(useCompareStore.getState().items).toHaveLength(0);
  });

  it('caps the comparison at four watches', () => {
    for (let index = 0; index < 6; index += 1) {
      useCompareStore.getState().toggle(makeProduct({ id: `p${index}`, name: `W${index}` }));
    }
    expect(useCompareStore.getState().items).toHaveLength(4);
  });

  it('removes a single product and clears the whole set', () => {
    for (let index = 0; index < 3; index += 1) {
      useCompareStore.getState().toggle(makeProduct({ id: `p${index}`, name: `W${index}` }));
    }
    useCompareStore.getState().remove('p1');
    expect(useCompareStore.getState().items.map((item) => item.id)).toEqual(['p0', 'p2']);
    useCompareStore.getState().clear();
    expect(useCompareStore.getState().items).toHaveLength(0);
  });
});
