import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSubscription } from "../_subscriptionManager";

const mocks = vi.hoisted(() => ({ channel: vi.fn() }));
vi.mock("lib/supabase.lib", () => ({ supabase: mocks }));

function makeChannel() {
  let onStatus: (status: string) => void = () => {};
  const payloadCallbacks: Array<
    (payload: RealtimePostgresChangesPayload<{ id: string }>) => void
  > = [];
  const channel = {
    on: vi.fn((_event, _filter, callback) => {
      payloadCallbacks.push(callback);
      return channel;
    }),
    subscribe: vi.fn((callback) => {
      onStatus = callback;
      return channel;
    }),
    unsubscribe: vi.fn(() => Promise.resolve("ok")),
    status: (status: string) => onStatus(status),
    payload: (payload: RealtimePostgresChangesPayload<{ id: string }>) =>
      payloadCallbacks.forEach((callback) => callback(payload)),
  };
  return channel;
}

const payload: RealtimePostgresChangesPayload<{ id: string }> = {
  schema: "public",
  table: "worlds",
  commit_timestamp: "now",
  errors: [],
  eventType: "UPDATE",
  new: { id: "world" },
  old: { id: "world" },
};

describe("subscription lifecycle", () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  });
  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    vi.restoreAllMocks();
  });

  it("refreshes opted-in snapshots when joining and reconnecting", () => {
    const channel = makeChannel();
    mocks.channel.mockReturnValue(channel);
    const load = vi.fn();
    cleanups.push(
      createSubscription("world", "worlds", "id=eq.world", load, vi.fn(), {
        refreshOnSubscribe: true,
      }),
    );
    expect(load).toHaveBeenCalledTimes(1);
    channel.status("SUBSCRIBED");
    channel.status("CHANNEL_ERROR");
    channel.status("SUBSCRIBED");
    expect(load).toHaveBeenCalledTimes(3);
  });

  it("preserves initial-load behavior for other subscriptions", () => {
    const channel = makeChannel();
    mocks.channel.mockReturnValue(channel);
    const load = vi.fn();
    const onPayload = vi.fn();
    cleanups.push(
      createSubscription("world", "worlds", "id=eq.world", load, onPayload),
    );
    channel.status("SUBSCRIBED");
    channel.payload(payload);
    expect(load).toHaveBeenCalledTimes(1);
    expect(onPayload).toHaveBeenCalledExactlyOnceWith(payload);
  });

  it("does not recreate a channel when disposed during an async restart", async () => {
    const channel = makeChannel();
    let finishUnsubscribe: (value: string) => void = () => {};
    channel.unsubscribe.mockReturnValue(
      new Promise((resolve) => {
        finishUnsubscribe = resolve;
      }),
    );
    mocks.channel.mockReturnValue(channel);
    const load = vi.fn();
    const onPayload = vi.fn();
    const cleanup = createSubscription(
      "world",
      "worlds",
      "id=eq.world",
      load,
      onPayload,
      { refreshOnSubscribe: true },
    );
    window.dispatchEvent(new Event("online"));
    window.dispatchEvent(new Event("visibilitychange"));
    cleanup();
    finishUnsubscribe("ok");
    await Promise.resolve();
    channel.status("SUBSCRIBED");
    channel.payload(payload);
    window.dispatchEvent(new Event("online"));
    expect(mocks.channel).toHaveBeenCalledTimes(1);
    expect(channel.unsubscribe).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
    expect(onPayload).not.toHaveBeenCalled();
  });

  it("ignores replaced channels and coalesces concurrent restart events", async () => {
    const first = makeChannel();
    const second = makeChannel();
    mocks.channel.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const load = vi.fn();
    const onPayload = vi.fn();
    cleanups.push(
      createSubscription("world", "worlds", "id=eq.world", load, onPayload, {
        refreshOnSubscribe: true,
      }),
    );
    window.dispatchEvent(new Event("online"));
    window.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    first.status("SUBSCRIBED");
    first.payload(payload);
    second.status("SUBSCRIBED");
    second.payload(payload);
    expect(mocks.channel).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenCalledTimes(3);
    expect(onPayload).toHaveBeenCalledTimes(1);
  });

  it("does not restart when the page is hidden", () => {
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    const channel = makeChannel();
    mocks.channel.mockReturnValue(channel);
    const load = vi.fn();
    cleanups.push(
      createSubscription("world", "worlds", "id=eq.world", load, vi.fn()),
    );
    window.dispatchEvent(new Event("online"));
    window.dispatchEvent(new Event("visibilitychange"));
    expect(channel.unsubscribe).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("resumes listening even if unsubscribing the old channel rejects", async () => {
    const first = makeChannel();
    const second = makeChannel();
    const failure = new Error("unsubscribe failed");
    first.unsubscribe.mockRejectedValue(failure);
    const reportError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.channel.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const load = vi.fn();
    cleanups.push(
      createSubscription("world", "worlds", "id=eq.world", load, vi.fn()),
    );
    window.dispatchEvent(new Event("online"));
    await Promise.resolve();
    expect(reportError).toHaveBeenCalledExactlyOnceWith(failure);
    expect(mocks.channel).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
