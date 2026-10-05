import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSubscription } from "../_subscriptionManager";
import { WorldDTO, WorldsRepository } from "../worlds.repository";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("../_subscriptionManager", () => ({ createSubscription: vi.fn() }));

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const world: WorldDTO = {
  id: "world",
  name: "Ironlands",
  description: null,
  setting_key: "world:classic/ironlands",
  configuration_customized: false,
  created_by: "owner",
  created_at: "2026-10-04",
  updated_at: "2026-10-04",
};

describe("world snapshot subscription", () => {
  let load: () => void;
  let payload: (payload: RealtimePostgresChangesPayload<WorldDTO>) => void;
  const unsubscribe = vi.fn();
  const onWorld = vi.fn();
  const onDeleted = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSubscription).mockImplementation(
      (_name, _table, _filter, initialLoad, onPayload) => {
        load = initialLoad;
        payload = onPayload;
        initialLoad();
        return unsubscribe;
      },
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it("opts into joined snapshots and delivers identical rows on reconnect", async () => {
    vi.spyOn(WorldsRepository, "getWorld").mockResolvedValue(world);
    const cleanup = WorldsRepository.listenToWorld(
      world.id,
      onWorld,
      onDeleted,
      onError,
    );
    await Promise.resolve();
    load();
    await Promise.resolve();
    expect(onWorld).toHaveBeenCalledTimes(2);
    expect(createSubscription).toHaveBeenCalledWith(
      "worlds:id=eq.world",
      "worlds",
      "id=eq.world",
      expect.any(Function),
      expect.any(Function),
      { refreshOnSubscribe: true },
    );
    cleanup();
  });

  it("ignores an initial snapshot that finishes after a newer realtime row", async () => {
    const pending = deferred<WorldDTO>();
    vi.spyOn(WorldsRepository, "getWorld").mockReturnValue(pending.promise);
    const cleanup = WorldsRepository.listenToWorld(
      world.id,
      onWorld,
      onDeleted,
      onError,
    );
    const newer = { ...world, name: "Updated world" };
    payload({
      schema: "public",
      table: "worlds",
      commit_timestamp: "now",
      errors: [],
      eventType: "UPDATE",
      old: {},
      new: newer,
    });
    pending.resolve(world);
    await Promise.resolve();
    expect(onWorld).toHaveBeenCalledExactlyOnceWith(newer);
    cleanup();
  });

  it("accepts only the newest reconnect read", async () => {
    const first = deferred<WorldDTO>();
    const second = deferred<WorldDTO>();
    vi.spyOn(WorldsRepository, "getWorld")
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const cleanup = WorldsRepository.listenToWorld(
      world.id,
      onWorld,
      onDeleted,
      onError,
    );
    load();
    const newer = { ...world, name: "Latest read" };
    second.resolve(newer);
    first.resolve(world);
    await Promise.resolve();
    expect(onWorld).toHaveBeenCalledExactlyOnceWith(newer);
    cleanup();
  });

  it("does not publish stale read errors after a delete", async () => {
    const pending = deferred<WorldDTO>();
    vi.spyOn(WorldsRepository, "getWorld").mockReturnValue(pending.promise);
    const cleanup = WorldsRepository.listenToWorld(
      world.id,
      onWorld,
      onDeleted,
      onError,
    );
    payload({
      schema: "public",
      table: "worlds",
      commit_timestamp: "now",
      errors: [],
      eventType: "DELETE",
      old: { id: world.id },
      new: {},
    });
    pending.reject(new Error("stale read"));
    await Promise.resolve();
    await Promise.resolve();
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    cleanup();
  });

  it.each(["resolve", "reject"] as const)(
    "ignores late read %s after cleanup",
    async (completion) => {
      const pending = deferred<WorldDTO>();
      vi.spyOn(WorldsRepository, "getWorld").mockReturnValue(pending.promise);
      const cleanup = WorldsRepository.listenToWorld(
        world.id,
        onWorld,
        onDeleted,
        onError,
      );
      cleanup();
      if (completion === "resolve") pending.resolve(world);
      else pending.reject(new Error("late read"));
      await Promise.resolve();
      await Promise.resolve();
      payload({
        schema: "public",
        table: "worlds",
        commit_timestamp: "now",
        errors: [],
        eventType: "UPDATE",
        old: {},
        new: world,
      });
      expect(onWorld).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    },
  );
});
