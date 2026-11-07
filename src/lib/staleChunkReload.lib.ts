// After a deploy, an open tab still runs the old build, and the chunks it
// asks for no longer exist. Vite reports every failed chunk load as a
// `vite:preloadError` event, whatever wording the browser uses for it
// (Safari's "'text/html' is not a valid JavaScript MIME type for module
// script" included). Reloading loads the new build at the page being opened.

const LAST_RELOAD_KEY = "stale-chunk-reload-at";

// A chunk that fails again this soon after a reload is missing from the new
// build too, so the error is shown instead of reloading in a loop.
export const STALE_CHUNK_RELOAD_GUARD_MS = 10_000;

interface StaleChunkReloadDeps {
  storage: Pick<Storage, "getItem" | "setItem">;
  now: () => number;
  reload: () => void;
}

export function reloadForStaleChunk(deps: StaleChunkReloadDeps): boolean {
  const { storage, now, reload } = deps;

  try {
    const lastReloadAt = Number(storage.getItem(LAST_RELOAD_KEY));
    if (lastReloadAt && now() - lastReloadAt < STALE_CHUNK_RELOAD_GUARD_MS) {
      return false;
    }
    storage.setItem(LAST_RELOAD_KEY, String(now()));
  } catch {
    // Without storage there is no loop guard, so leave the error to show.
    return false;
  }

  reload();
  return true;
}

let reloadPending = false;

// True once a stale chunk reload has started. The failed import still
// rejects, so error boundaries check this and render nothing rather than
// flash the crash page while the new build loads.
export function isStaleChunkReloadPending() {
  return reloadPending;
}

export function installStaleChunkReload(
  deps: StaleChunkReloadDeps = {
    // Read lazily: touching sessionStorage throws where storage is blocked.
    storage: {
      getItem: (key) => window.sessionStorage.getItem(key),
      setItem: (key, value) => window.sessionStorage.setItem(key, value),
    },
    now: () => Date.now(),
    reload: () => window.location.reload(),
  },
) {
  window.addEventListener("vite:preloadError", () => {
    // The event is deliberately not cancelled: cancelling makes the import
    // resolve to undefined, which React.lazy turns into a different crash.
    // One page load can fail several chunks at once; the first starts the
    // reload, and the rest must not trip the loop guard.
    if (reloadPending) return;
    reloadPending = reloadForStaleChunk(deps);
  });
}
