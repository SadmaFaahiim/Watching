// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearMockDb,
  loadMockDb,
  MOCK_DB_SCHEMA_VERSION,
  registerMockDbMigration,
  saveMockDb,
} from '@/mocks/storage';
import { makeProduct, makeUser } from '@/test/factories';
import type { AuditEvent, Order } from '@/types';

const buildOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'o1',
  userId: 'user-1',
  items: [{ productId: 'p1', quantity: 2, product: makeProduct({ id: 'p1', name: 'Diver Pro' }) }],
  subtotal: 200,
  shipping: 0,
  tax: 10,
  total: 210,
  shippingAddress: {
    fullName: 'Alice',
    phone: '+1 555 010 2030',
    addressLine1: '1 Lakeview',
    city: 'Geneva',
    state: 'GE',
    postalCode: '1204',
    country: 'Switzerland',
  },
  orderStatus: 'processing',
  paymentStatus: 'paid',
  paymentMethod: 'card',
  createdAt: new Date('2025-01-01T10:00:00Z'),
  updatedAt: new Date('2025-01-02T10:00:00Z'),
  history: [
    { at: new Date('2025-01-01T10:00:00Z'), actor: 'Alice', action: 'Order placed' },
    { at: new Date('2025-01-02T09:00:00Z'), actor: 'Store admin', action: 'Status changed to processing' },
  ],
  ...overrides,
});

describe('mock database storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips products, orders, users and audit events', () => {
    const user = makeUser({
      id: 'user-1',
      emailVerified: false,
      history: [
        { at: new Date('2025-03-01T00:00:00Z'), actor: 'Store admin', action: 'Admin access granted' },
      ] as AuditEvent[],
    });
    const product = makeProduct({ id: 'p1', stock: 3 });
    const order = buildOrder();

    saveMockDb({ products: [product], orders: [order], users: [user] });
    const loaded = loadMockDb();

    expect(loaded).not.toBeNull();
    expect(loaded?.products).toHaveLength(1);
    expect(loaded?.orders).toHaveLength(1);
    expect(loaded?.users).toHaveLength(1);

    // Date fields survive the JSON round trip as real Date instances.
    expect(loaded?.products[0]?.createdAt).toBeInstanceOf(Date);
    expect(loaded?.orders[0]?.createdAt).toBeInstanceOf(Date);
    expect(loaded?.orders[0]?.items[0]?.product.updatedAt).toBeInstanceOf(Date);
    expect(loaded?.users[0]?.createdAt).toBeInstanceOf(Date);
    expect(loaded?.orders[0]?.history?.[1]?.at).toBeInstanceOf(Date);

    expect(loaded?.orders[0]?.total).toBe(210);
    expect(loaded?.orders[0]?.items[0]?.product.name).toBe('Diver Pro');
    expect(loaded?.users[0]?.emailVerified).toBe(false);
    expect(loaded?.users[0]?.history?.[0]?.action).toBe('Admin access granted');
  });

  it('upgrades legacy (pre-envelope) snapshots through the migration registry', () => {
    // v1 of the schema had no `mfaEnabled` on users and no images on products.
    registerMockDbMigration(1, (db) => ({
      products: db.products.map((product) => ({
        ...product,
        thumbnail: product.thumbnail || 'https://example.test/thumb.jpg',
        images: product.images?.length ? product.images : ['https://example.test/img.jpg'],
      })),
      users: db.users.map((user) => ({ ...user, mfaEnabled: user.mfaEnabled ?? false, passkeys: user.passkeys ?? [] })),
      orders: db.orders,
    }));

    // Write a raw v1 snapshot WITHOUT the schemaVersion envelope.
    const v1 = {
      products: [makeProduct({ thumbnail: '', images: [] })],
      orders: [buildOrder()],
      users: [makeUser()],
    };
    localStorage.setItem('cwp-mock-db-v1', JSON.stringify(v1));

    const migrated = loadMockDb();

    expect(migrated).not.toBeNull();
    expect(migrated?.products[0]?.thumbnail).toBe('https://example.test/thumb.jpg');
    expect(migrated?.products[0]?.images).toHaveLength(1);
    expect(migrated?.users[0]?.mfaEnabled).toBe(false);
    expect(migrated?.orders[0]?.history).toHaveLength(2);
  });

  it('rejects snapshots from the future', () => {
    localStorage.setItem(
      'cwp-mock-db-v1',
      JSON.stringify({
        schemaVersion: MOCK_DB_SCHEMA_VERSION + 1,
        snapshot: { products: [makeProduct()], orders: [buildOrder()], users: [makeUser()] },
      })
    );
    expect(loadMockDb()).toBeNull();
  });

  it('returns null when nothing has been saved', () => {
    expect(loadMockDb()).toBeNull();
  });

  it('returns null and clears the key for corrupt payloads', () => {
    localStorage.setItem('cwp-mock-db-v1', '{not valid json');
    expect(loadMockDb()).toBeNull();
    expect(localStorage.getItem('cwp-mock-db-v1')).toBeNull();
  });

  it('returns null for a malformed-but-parseable snapshot', () => {
    localStorage.setItem(
      'cwp-mock-db-v1',
      JSON.stringify({ schemaVersion: 2, snapshot: { products: 'nope', orders: [], users: [] } })
    );
    expect(loadMockDb()).toBeNull();
  });

  it('clearMockDb removes the saved snapshot', () => {
    saveMockDb({ products: [makeProduct()], orders: [buildOrder()], users: [makeUser()] });
    expect(loadMockDb()).not.toBeNull();
    clearMockDb();
    expect(loadMockDb()).toBeNull();
  });
});