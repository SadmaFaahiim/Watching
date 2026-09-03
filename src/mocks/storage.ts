import type { Order, Product, User } from '@/types';

/**
 * Versioned localStorage persistence for the in-memory mock database.
 *
 * Mutations made through the mock adapter (orders placed, products added,
 * statuses advanced, roles toggled, 2FA enrolled) normally vanish on reload.
 * This module snapshots the three seeded collections under a stable key and
 * restores them on the next boot, so demo QA survives refreshes.
 *
 * Every snapshot carries a schemaVersion envelope. Bump SCHEMA_VERSION when a
 * seed shape changes and register a migration for the previous version — old
 * snapshots are upgraded in place instead of silently discarded. Snapshots
 * from versions with no migration path (or from the future) fall back to a
 * fresh seed.
 */

export const MOCK_DB_SCHEMA_VERSION = 2;

const DB_KEY = 'cwp-mock-db-v1';

export interface MockDbSnapshot {
  products: Product[];
  orders: Order[];
  users: User[];
}

interface PersistedMockDb {
  schemaVersion: number;
  snapshot: MockDbSnapshot;
}

type Migration = (db: MockDbSnapshot) => MockDbSnapshot;

const migrations = new Map<number, Migration>();

/** Register a migration that upgrades a snapshot from `fromVersion` to the next. */
export const registerMockDbMigration = (fromVersion: number, migrate: Migration): void => {
  migrations.set(fromVersion, migrate);
};

// Date-typed fields across the entity graph. JSON.stringify turns Date into an
// ISO string, so on load we revive exactly these keys back into Date objects.
const DATE_KEYS = new Set(['createdAt', 'updatedAt', 'addedAt', 'at']);

const isDateString = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value);

const revive = (_key: string, value: unknown): unknown => {
  if (DATE_KEYS.has(_key) && isDateString(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  return value;
};

export const saveMockDb = (snapshot: MockDbSnapshot): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    const payload: PersistedMockDb = { schemaVersion: MOCK_DB_SCHEMA_VERSION, snapshot };
    localStorage.setItem(DB_KEY, JSON.stringify(payload));
  } catch {
    // Non-fatal (private mode / storage full) — the demo simply resets on reload.
  }
};

const isSnapshot = (value: unknown): value is MockDbSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<MockDbSnapshot>;
  return (
    Array.isArray(candidate.products) &&
    Array.isArray(candidate.orders) &&
    Array.isArray(candidate.users)
  );
};

/**
 * Upgrades a snapshot through every registered migration up to the current
 * schema version. Returns null when no path exists for the starting version.
 */
export const migrateSnapshot = (
  fromVersion: number,
  db: MockDbSnapshot
): { version: number; snapshot: MockDbSnapshot } | null => {
  let version = fromVersion;
  let snapshot = db;
  while (version < MOCK_DB_SCHEMA_VERSION) {
    const migrate = migrations.get(version);
    if (!migrate) return null; // No known path forward.
    snapshot = migrate(snapshot);
    version += 1;
  }
  return { version, snapshot };
};

/** Parses and validates a persisted payload (enveloped or legacy bare snapshot). */
export const parseMockDbPayload = (raw: string): { version: number; db: MockDbSnapshot } | null => {
  try {
    const parsed = JSON.parse(raw, revive) as PersistedMockDb | MockDbSnapshot | null;
    if (!parsed || typeof parsed !== 'object') return null;

    // Snapshots saved before the envelope existed are treated as version 1.
    const isEnveloped = 'schemaVersion' in parsed && 'snapshot' in parsed;
    const version = isEnveloped ? (parsed as PersistedMockDb).schemaVersion : 1;
    const db = isEnveloped ? (parsed as PersistedMockDb).snapshot : (parsed as MockDbSnapshot);

    if (!isSnapshot(db)) return null;
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return null;
    if (version > MOCK_DB_SCHEMA_VERSION) return null;
    return { version, db };
  } catch {
    return null;
  }
};

export const loadMockDb = (): MockDbSnapshot | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return null;

    const payload = parseMockDbPayload(raw);
    if (!payload) {
      // Unreadable payloads are dropped so the next boot seeds cleanly.
      try {
        localStorage.removeItem(DB_KEY);
      } catch {
        // Ignore.
      }
      return null;
    }
    const migrated = migrateSnapshot(payload.version, payload.db);
    return migrated ? migrated.snapshot : null;
  } catch {
    // Corrupt payloads (schema drift, manual edits) fall back to a fresh seed.
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(DB_KEY);
    } catch {
      // Ignore.
    }
    return null;
  }
};

export const clearMockDb = (): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(DB_KEY);
  } catch {
    // Ignore.
  }
};
