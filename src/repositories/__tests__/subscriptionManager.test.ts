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

// A stand-in query: each read resolves when the test says so, and its result
// is applied only while the manager still calls it current.
function earlyReads() {
  const reads: { resolve: () => void }[] = [];
  const applied: number[] = [];
  const load = vi.fn((isCurrent: () => boolean) => {
    const read = reads.length;
    reads.push({
      resolve: () => {
        if (isCurrent()) applied.push(read);
      },
    });
  });
  const unsubscribe = createSubscription(
    "channel",
    "table",
    "id=eq.1",
    load,
    () => {},
    { loadBeforeJoin: true },
  );
  return { reads, applied, load, unsubscribe };
}

describe("createSubscription reading before the join", () => {
  it("applies an early read that arrives before the post-join read", () => {
    const { reads, applied, load, unsubscribe } = earlyReads();
    expect(load).toHaveBeenCalledOnce();
    reads[0].resolve();
    expect(applied).toEqual([0]);

    mocks.channels[0].report("SUBSCRIBED");
    expect(load).toHaveBeenCalledTimes(2);
    reads[1].resolve();
    expect(applied).toEqual([0, 1]);
    unsubscribe();
  });

  it("drops an early read that arrives after the post-join read was issued", () => {
    const { reads, applied, unsubscribe } = earlyReads();
    mocks.channels[0].report("SUBSCRIBED");
    reads[0].resolve();
    expect(applied).toEqual([]);

    reads[1].resolve();
    expect(applied).toEqual([1]);
    unsubscribe();
  });

  it("does not read twice when the first join fails", () => {
    const { reads, applied, load, unsubscribe } = earlyReads();
    mocks.channels[0].report("CHANNEL_ERROR");
    mocks.channels[0].report("TIMED_OUT");
    expect(load).toHaveBeenCalledOnce();
    reads[0].resolve();
    expect(applied).toEqual([0]);

    // A later join still reads, since events before it were missed.
    mocks.channels[0].report("SUBSCRIBED");
    expect(load).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("drops reads still pending at cleanup and ignores a later join", () => {
    const { reads, applied, load, unsubscribe } = earlyReads();
    unsubscribe();
    reads[0].resolve();
    mocks.channels[0].report("SUBSCRIBED");
    expect(applied).toEqual([]);
    expect(load).toHaveBeenCalledOnce();
  });

  it("reads after a replaced channel joins or fails, ignoring the old channel", async () => {
    const { reads, applied, load, unsubscribe } = earlyReads();
    window.dispatchEvent(new Event("online"));
    await vi.waitFor(() => expect(mocks.channels).toHaveLength(2));

    mocks.channels[0].report("SUBSCRIBED");
    expect(load).toHaveBeenCalledOnce();
    // The early read is still the newest one, so it lands.
    reads[0].resolve();
    expect(applied).toEqual([0]);

    mocks.channels[1].report("CHANNEL_ERROR");
    expect(load).toHaveBeenCalledTimes(2);
    mocks.channels[1].report("SUBSCRIBED");
    expect(load).toHaveBeenCalledTimes(3);
    reads[1].resolve();
    reads[2].resolve();
    expect(applied).toEqual([0, 2]);
    unsubscribe();
  });
});
