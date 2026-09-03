import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  capitalize,
  calculateDiscount,
  debounce,
  formatCurrency,
  getRelativeTime,
  isEmpty,
  slugify,
  storage,
  throttle,
  truncate,
} from '@/utils/helpers';

describe('formatters', () => {
  it('formats currency as USD', () => {
    expect(formatCurrency(1500)).toBe('$1,500.00');
  });

  it('formats small amounts', () => {
    expect(formatCurrency(49.9)).toBe('$49.90');
  });
});

describe('string helpers', () => {
  it('capitalizes a word', () => {
    expect(capitalize('luxury')).toBe('Luxury');
  });

  it('truncates long text with an ellipsis', () => {
    expect(truncate('A very long product name', 10)).toBe('A very lon...');
    expect(truncate('Short', 10)).toBe('Short');
  });

  it('slugifies text', () => {
    expect(slugify('Classic Watch Pro!')).toBe('classic-watch-pro');
  });
});

describe('number helpers', () => {
  it('calculates discount percentages', () => {
    expect(calculateDiscount(1500, 1200)).toBe(20);
    expect(calculateDiscount(100, 100)).toBe(0);
  });
});

describe('isEmpty', () => {
  it('detects empty objects', () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe('getRelativeTime', () => {
  it('returns just now for the current moment', () => {
    expect(getRelativeTime(new Date())).toBe('just now');
  });

  it('returns minutes ago', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000);
    expect(getRelativeTime(past)).toBe('5 minutes ago');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only fires once after rapid calls', () => {
    let calls = 0;
    const run = debounce(() => {
      calls += 1;
    }, 100);

    run();
    run();
    vi.advanceTimersByTime(50);
    run();
    vi.advanceTimersByTime(100);

    expect(calls).toBe(1);
  });

  it('does not fire before the wait period elapses', () => {
    let calls = 0;
    const run = debounce(() => {
      calls += 1;
    }, 100);

    run();
    vi.advanceTimersByTime(99);
    expect(calls).toBe(0);
    vi.advanceTimersByTime(1);
    expect(calls).toBe(1);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('limits calls to one per window', () => {
    let calls = 0;
    const run = throttle(() => {
      calls += 1;
    }, 100);

    run();
    run();
    expect(calls).toBe(1);

    vi.advanceTimersByTime(101);
    run();
    expect(calls).toBe(2);
  });
});

describe('storage wrapper', () => {
  it('round-trips typed values', () => {
    const payload = { cart: ['a', 'b'], user: null };
    storage.set('test-key', payload);
    expect(storage.get<typeof payload>('test-key')).toEqual(payload);
  });

  it('returns the default when a key is missing', () => {
    storage.remove('missing-key');
    expect(storage.get('missing-key', 'fallback')).toBe('fallback');
    expect(storage.get('missing-key')).toBeNull();
  });

  it('removes keys', () => {
    storage.set('test-key', 1);
    storage.remove('test-key');
    expect(storage.get('test-key')).toBeNull();
  });
});
