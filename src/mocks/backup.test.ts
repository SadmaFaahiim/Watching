// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { Order } from '@/types';

// data.ts is a module singleton seeded at import time, so the backup functions
// are loaded lazily after each localStorage reset.
const loadDataModule = async () => {
  const module = await import('@/mocks/data');
  return module;
};

describe('mock database backup / restore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exports the live DB as a versioned JSON payload', async () => {
    const data = await loadDataModule();
    data.resetMockDb();

    const raw = data.exportMockDbBackup();
    const parsed = JSON.parse(raw);

    expect(parsed.app).toBe('classic-watch-pro');
    expect(parsed.schemaVersion).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(parsed.snapshot.products)).toBe(true);
    expect(Array.isArray(parsed.snapshot.orders)).toBe(true);
    expect(Array.isArray(parsed.snapshot.users)).toBe(true);
    expect(parsed.snapshot.products.length).toBeGreaterThan(0);
  });

  it('round-trips mutations through export → reset → import', async () => {
    const data = await loadDataModule();
    data.resetMockDb();
    const originalOrderCount = data.seedOrders.length;

    // Place a mutation the export must capture.
    const order = {
      id: 'backup-o1',
      userId: 'demo-user',
      items: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      shippingAddress: {
        fullName: 'B',
        phone: '1',
        addressLine1: 'x',
        city: 'y',
        state: 'z',
        postalCode: '1',
        country: 'w',
      },
      orderStatus: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: 'card',
      createdAt: new Date('2026-09-03T00:00:00Z'),
      updatedAt: new Date('2026-09-03T00:00:00Z'),
    } as unknown as Order;
    data.seedOrders.push(order);
    const backup = data.exportMockDbBackup();

    data.resetMockDb();
    expect(data.seedOrders.find((item) => item.id === 'backup-o1')).toBeUndefined();

    const result = data.importMockDbBackup(backup);
    expect(result.ok).toBe(true);
    expect(data.seedOrders).toHaveLength(originalOrderCount + 1);
    expect(data.seedOrders.find((item) => item.id === 'backup-o1')?.createdAt).toBeInstanceOf(Date);
    // Restore persists to localStorage so a reload keeps it.
    const persisted = JSON.parse(localStorage.getItem('cwp-mock-db-v1') ?? '{}');
    expect(
      persisted.snapshot.orders.find((item: { id: string }) => item.id === 'backup-o1')
    ).toBeDefined();
  });

  it('rejects garbage and empty inputs with safe messages', async () => {
    const data = await loadDataModule();
    data.resetMockDb();

    const empty = data.importMockDbBackup('');
    expect(empty.ok).toBe(false);
    expect(empty.error).toMatch(/empty/);

    const garbage = data.importMockDbBackup('{"hello":"world"}');
    expect(garbage.ok).toBe(false);
    expect(garbage.error).toMatch(/not a valid mock-database backup/);
  });

  it('rejects backups from a newer schema version', async () => {
    const data = await loadDataModule();
    data.resetMockDb();

    const future = JSON.stringify({
      app: 'classic-watch-pro',
      schemaVersion: 999,
      snapshot: { products: [], orders: [], users: [] },
    });
    const result = data.importMockDbBackup(future);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/newer version/);
  });

  it('upgrades legacy bare snapshots (pre-envelope v1) on import', async () => {
    const data = await loadDataModule();
    data.resetMockDb();

    // A v1 snapshot has no envelope and no product images.
    const legacy = JSON.stringify({
      products: [{ id: 'legacy-p1', name: 'Legacy Watch' }],
      orders: [],
      users: [{ id: 'legacy-u1', email: 'legacy@example.com', displayName: 'Legacy' }],
    });

    const result = data.importMockDbBackup(legacy);
    expect(result.ok).toBe(true);
    expect(data.seedProducts.find((p) => p.id === 'legacy-p1')?.name).toBe('Legacy Watch');
    expect(data.seedUsers.find((u) => u.id === 'legacy-u1')?.email).toBe('legacy@example.com');
  });
});
