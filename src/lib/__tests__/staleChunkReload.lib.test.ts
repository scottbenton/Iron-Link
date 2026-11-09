import { describe, expect, it, vi } from "vitest";

import {
  STALE_CHUNK_RELOAD_GUARD_MS,
  reloadForStaleChunk,
} from "../staleChunkReload.lib";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("reloadForStaleChunk", () => {
  it("reloads the first time a chunk fails to load", () => {
    const reload = vi.fn();
    expect(
      reloadForStaleChunk({
        storage: memoryStorage(),
        now: () => 1000,
        reload,
      }),
    ).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("does not reload again right after a reload, so a missing chunk can't loop", () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    reloadForStaleChunk({ storage, now: () => 1000, reload });
    expect(
      reloadForStaleChunk({
        storage,
        now: () => 1000 + STALE_CHUNK_RELOAD_GUARD_MS - 1,
        reload,
      }),
    ).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("reloads again for a later deploy once the guard has passed", () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    reloadForStaleChunk({ storage, now: () => 1000, reload });
    expect(
      reloadForStaleChunk({
        storage,
        now: () => 1000 + STALE_CHUNK_RELOAD_GUARD_MS,
        reload,
      }),
    ).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does not reload when storage is unavailable", () => {
    const reload = vi.fn();
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(reloadForStaleChunk({ storage, now: () => 1000, reload })).toBe(
      false,
    );
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("installStaleChunkReload", () => {
  it("reloads once when one page load fails several chunks", async () => {
    vi.resetModules();
    const { installStaleChunkReload, isStaleChunkReloadPending } = await import(
      "../staleChunkReload.lib"
    );
    const reload = vi.fn();
    installStaleChunkReload({
      storage: memoryStorage(),
      now: () => 1000,
      reload,
    });

    expect(isStaleChunkReloadPending()).toBe(false);
    window.dispatchEvent(new Event("vite:preloadError"));
    window.dispatchEvent(new Event("vite:preloadError"));

    expect(reload).toHaveBeenCalledOnce();
    expect(isStaleChunkReloadPending()).toBe(true);
  });
});
