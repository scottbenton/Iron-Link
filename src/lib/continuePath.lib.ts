// Whitespace, ASCII control characters, and DEL. The URL parser silently
// strips some of these (e.g. "/\t/evil.com" parses as "//evil.com"), so any
// path containing them is rejected outright.
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARACTERS = /[\u0000- \u007f\\]/;

/**
 * Returns `path` as a same-origin path (pathname + search + hash) if it is
 * safe to navigate to after login, or null otherwise.
 *
 * `continuePath` comes from the URL, so anyone can craft a link with it. A
 * value like "//evil.com" or "/\evil.com" is treated by browsers as a
 * different origin, and react-router falls back to `window.location.assign`
 * when `pushState` rejects a cross-origin URL, so unchecked values become an
 * open redirect.
 *
 * Rules: the path must be a non-empty string that starts with a single "/"
 * (not "//"), contains no backslashes, whitespace, or control characters, and
 * resolves against `origin` to a URL on that same origin.
 */
export function getSafeContinuePath(
  path: string | null | undefined,
  origin: string,
): string | null {
  if (!path) {
    return null;
  }
  if (!path.startsWith("/") || path.startsWith("//")) {
    return null;
  }
  if (UNSAFE_CHARACTERS.test(path)) {
    return null;
  }

  let resolved: URL;
  try {
    resolved = new URL(path, origin);
  } catch {
    return null;
  }
  if (resolved.origin !== new URL(origin).origin) {
    return null;
  }

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
