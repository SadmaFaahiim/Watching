// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { makeProduct } from '@/test/factories';
import type { Product } from '@/types';
import { useCompareStore } from '@/store/compare.store';
import { useCrossTabCompareSync } from './useCrossTabCompareSync';

let sharedInstance: {
  listeners: Array<(event: MessageEvent) => void>;
  postCalls: Array<unknown>;
} | null = null;

class MockBroadcastChannel {
  public listeners: Array<(event: MessageEvent) => void> = [];
  public postCalls: Array<unknown> = [];
  public name: string;

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

  close() {}
}

const createProduct = (overrides?: Partial<Product>) =>
  makeProduct({ id: 'test', ...overrides });

describe('useCrossTabCompareSync', () => {
  beforeEach(() => {
    useCompareStore.setState({ items: [], drawerOpen: false });
    sharedInstance = null;
    vi.clearAllMocks();
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sharedInstance = null;
  });

  it('replaces the local compare list when another tab broadcasts compare-sync', () => {
    const { unmount } = renderHook(() => useCrossTabCompareSync());
    const instance = sharedInstance;
    expect(instance).not.toBeNull();

    const remote = [createProduct({ id: 'r-1' }), createProduct({ id: 'r-2' })];

    act(() => {
      instance!.listeners[0](new MessageEvent('message', { data: { type: 'compare-sync', items: remote } }));
    });

    const items = useCompareStore.getState().items;
    expect(items.map((item) => item.id)).toEqual(['r-1', 'r-2']);
    unmount();
  });

  it('caps a remote list at the compare limit', () => {
    const { unmount } = renderHook(() => useCrossTabCompareSync());
    const instance = sharedInstance;
    expect(instance).not.toBeNull();

    const remote = Array.from({ length: 6 }, (_, index) =>
      createProduct({ id: `r-${index + 1}` })
    );

    act(() => {
      instance!.listeners[0](new MessageEvent('message', { data: { type: 'compare-sync', items: remote } }));
    });

    expect(useCompareStore.getState().items).toHaveLength(4);
    unmount();
  });

  it('ignores messages that are not compare-sync', () => {
    const { unmount } = renderHook(() => useCrossTabCompareSync());
    const instance = sharedInstance;
    expect(instance).not.toBeNull();

    act(() => {
      instance!.listeners[0](new MessageEvent('message', { data: { type: 'product-focus', product: createProduct() } }));
    });

    expect(useCompareStore.getState().items).toHaveLength(0);
    unmount();
  });

  it('broadcasts local compare changes to other tabs', () => {
    const { unmount } = renderHook(() => useCrossTabCompareSync());
    const instance = sharedInstance;
    expect(instance).not.toBeNull();

    const product = createProduct({ id: 'local-1' });

    act(() => {
      useCompareStore.getState().toggle(product);
    });

    expect(instance!.postCalls[0]).toMatchObject({
      type: 'compare-sync',
      items: [expect.objectContaining({ id: 'local-1' })],
    });

    act(() => {
      useCompareStore.getState().clear();
    });

    expect(instance!.postCalls[1]).toEqual({ type: 'compare-sync', items: [] });
    unmount();
  });

  it('does not echo a remote update back to the channel', () => {
    const { unmount } = renderHook(() => useCrossTabCompareSync());
    const instance = sharedInstance;
    expect(instance).not.toBeNull();

    const remote = [createProduct({ id: 'r-1' })];

    act(() => {
      instance!.listeners[0](new MessageEvent('message', { data: { type: 'compare-sync', items: remote } }));
    });

    expect(useCompareStore.getState().items).toHaveLength(1);
    expect(instance!.postCalls).toHaveLength(0);
    unmount();
  });
});