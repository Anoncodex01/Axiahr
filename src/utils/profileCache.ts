/**
 * Short-lived hand-off of the /api/candidates/profile response between pages,
 * so the profile page -> profile wizard redirect doesn't refetch the same data.
 */

const KEY = 'candidateProfileHandoff';
const MAX_AGE_MS = 30_000;

export function cacheProfileResponse(result: unknown) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), result }));
  } catch {
    // sessionStorage unavailable or full; callers fall back to fetching
  }
}

/** Pass `consume: true` from the last reader so later reloads always hit the API. */
export function readCachedProfileResponse(consume = false): any | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    if (consume) sessionStorage.removeItem(KEY);
    const { at, result } = JSON.parse(raw);
    return Date.now() - at < MAX_AGE_MS ? result : null;
  } catch {
    return null;
  }
}
