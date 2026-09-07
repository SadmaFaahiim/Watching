/**
 * Open a same-origin `BroadcastChannel` with a safe fallback.
 *
 * Returns `null` when `BroadcastChannel` is unavailable (e.g. jsdom) or
 * construction fails, so callers can treat the channel as optional.
 */
export function openBroadcastChannel(name: string): BroadcastChannel | null {
  const GlobalBC = globalThis.BroadcastChannel;
  if (typeof GlobalBC !== 'function') {
    return null;
  }
  try {
    return new GlobalBC(name);
  } catch {
    return null;
  }
}