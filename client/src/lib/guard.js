/**
 * Tracks whether an unsaved / in-progress workout is active, so the app can
 * warn before an accidental refresh, close, or back-navigation. Components
 * call pushGuard() on mount and invoke the returned release on unmount.
 */
let count = 0;

export function pushGuard() {
  count += 1;
  return () => { count = Math.max(0, count - 1); };
}

export function isGuarded() {
  return count > 0;
}
