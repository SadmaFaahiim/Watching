// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { makeProduct } from '@/test/factories';
import type { Product } from '@/types';
import { useRecentlyViewedStore } from '@/store/recentlyViewed.store';
import { useCrossTabTrackedTabs } from './useCrossTabTrackedTabs';

// BroadcastChannel is not available in jsdom — replace the real one with a
// mock whose instance and calls are exposed for test assertions.
let sharedInstance: {
  listeners: Array<(event: MessageEvent) => void>;
  postCalls: Array<unknown>;
} | null = null;

class MockBroadcastChannel {
  public listeners: Array<(event: MessageEvent) => void> = [];
  public postCalls: Array<unknown> = [];
  public name: string;
  public active = true;

  constructor(name: string) {
    this.name = name;
    // The mock exposes its single instance so tests can drive messages.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    sharedInstance = this;
  }

  addEventListener(_type: string, listener: (event: MessageEvent) => void) {
    this.listeners.push(listener);
  }

  removeEventListener(_type: string, listener: (event: MessageEvent) => void) {
    const idx = this.listeners.indexOf(listener);
    if (idx > -1) this.listeners.splice(idx, 1);
  }

  postMessage(data: unknown) {
    this.postCalls.push(data);
  }

  close() {
    this.active = false;
  }
}

const createProduct = (overrides?: Partial<Product>) =>
  makeProduct({ id: 'test', ...overrides });

describe('useCrossTabTrackedTabs', () => {
  beforeEach(() => {
    useRecentlyViewedStore.setState({ items: [] });
    sharedInstance = null;
    vi.clearAllMocks();
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sharedInstance = null;
  });

  it('records a product from another tab when a product-focus message arrives', () => {
    const { unmount } = renderHook(() => useCrossTabTrackedTabs());
    const instance = sharedInstance;
    expect(instance).not.toBeNull();

    const otherProduct = createProduct({ id: 'p-2', name: 'Other Watch' });
    const message = new MessageEvent('message', {
      data: { type: 'product-focus', product: otherProduct },
    });

    act(() => {
      instance!.listeners[0](message);
    });

    const items = useRecentlyViewedStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'p-2', name: 'Other Watch' });

    unmount();
  });

  it('ignores messages without a product-focus type', () => {
    const { unmount } = renderHook(() => useCrossTabTrackedTabs());
    const instance = sharedInstance;
    expect(instance).not.toBeNull();

    const unrelated = new MessageEvent('message', {
      data: { type: 'promo-applied', code: 'WELCOME10' },
    });

    act(() => {
      instance!.listeners[0](unrelated);
    });

    expect(useRecentlyViewedStore.getState().items).toHaveLength(0);

    unmount();
  });

  it('records each announced product, replacing any earlier copy of the same id', () => {
    const { unmount } = renderHook(() => useCrossTabTrackedTabs());
    const instance = sharedInstance;
    expect(instance).not.toBeNull();

    const first = createProduct({ id: 'p-1', name: 'First' });
    const second = createProduct({ id: 'p-1', name: 'First Redesign' });
    const third = createProduct({ id: 'p-3', name: 'Third' });

    act(() => {
      instance!.listeners[0](new MessageEvent('message', { data: { type: 'product-focus', product: first } }));
      instance!.listeners[0](new MessageEvent('message', { data: { type: 'product-focus', product: second } }));
      instance!.listeners[0](new MessageEvent('message', { data: { type: 'product-focus', product: third } }));
    });

    const items = useRecentlyViewedStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: 'p-3', name: 'Third' });
    expect(items[1]).toMatchObject({ id: 'p-1', name: 'First Redesign' });

    unmount();
  });

  it('posts a product-focus message to other tabs and posts product-blur when set to null', () => {
    const { result } = renderHook(() => useCrossTabTrackedTabs());
    const instance = sharedInstance;
    expect(instance).not.toBeNull();

    const product = createProduct({ id: 'p-4' });

    act(() => {
      (result.current as { setCurrent: (product: unknown) => void }).setCurrent(product);
    });

    expect(instance!.postCalls[0]).toMatchObject({
      type: 'product-focus',
      product: expect.objectContaining({ id: 'p-4' }),
    });

    act(() => {
      (result.current as { setCurrent: (product: unknown) => void }).setCurrent(null);
    });

    expect(instance!.postCalls[1]).toEqual({ type: 'product-blur' });
  });
});