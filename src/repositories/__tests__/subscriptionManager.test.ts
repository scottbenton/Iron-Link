import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSubscription } from "../_subscriptionManager";

type Status = "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED";

const mocks = vi.hoisted(() => ({
  channels: [] as {
    report: (status: Status) => void;
    unsubscribe: ReturnType<typeof vi.fn>;
  }[],
}));

vi.mock("lib/supabase.lib", () => ({
  supabase: {
    channel: () => {
      const entry = {
        report: (() => {}) as (status: Status) => void,
        unsubscribe: vi.fn(() => Promise.resolve("ok")),
      };
      mocks.channels.push(entry);
      const channel = {
        on: () => channel,
        subscribe: (callback: (status: Status) => void) => {
          entry.report = callback;
          return channel;
        },
        unsubscribe: entry.unsubscribe,
      };
      return channel;
    },
  },
}));

beforeEach(() => {
  mocks.channels = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

const subscribe = (load: () => void) =>
  createSubscription("channel", "table", "id=eq.1", load, () => {});

describe("createSubscription", () => {
  it("reads the snapshot only once the channel has joined", () => {
    const load = vi.fn();
    const unsubscribe = subscribe(load);
    expect(load).not.toHaveBeenCalled();

    mocks.channels[0].report("SUBSCRIBED");
    expect(load).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("reads again whenever Supabase rejoins the channel after a dropped connection", () => {
    const load = vi.fn();
    const unsubscribe = subscribe(load);
    mocks.channels[0].report("SUBSCRIBED");
    mocks.channels[0].report("CHANNEL_ERROR");
    mocks.channels[0].report("SUBSCRIBED");
    expect(load).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("still shows data when realtime cannot join", () => {
    const load = vi.fn();
    const unsubscribe = subscribe(load);
    mocks.channels[0].report("TIMED_OUT");
    mocks.channels[0].report("TIMED_OUT");
    expect(load).toHaveBeenCalledOnce();

    mocks.channels[0].report("SUBSCRIBED");
    expect(load).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("resubscribes when the browser comes back online and ignores the old channel", async () => {
    const load = vi.fn();
    const unsubscribe = subscribe(load);
    mocks.channels[0].report("SUBSCRIBED");

    window.dispatchEvent(new Event("online"));
    await vi.waitFor(() => expect(mocks.channels).toHaveLength(2));
    expect(mocks.channels[0].unsubscribe).toHaveBeenCalledOnce();

    mocks.channels[0].report("SUBSCRIBED");
    expect(load).toHaveBeenCalledOnce();
    mocks.channels[1].report("SUBSCRIBED");
    expect(load).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("ignores a join that completes after cleanup", () => {
    const load = vi.fn();
    subscribe(load)();
    mocks.channels[0].report("SUBSCRIBED");
    expect(load).not.toHaveBeenCalled();
  });
});
