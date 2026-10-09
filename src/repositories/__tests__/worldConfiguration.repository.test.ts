import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  WorldConfigurationDTO,
  WorldConfigurationRepository,
} from "../worldConfiguration.repository";

const mocks = vi.hoisted(() => ({
  payloadHandlers: [] as ((payload: { errors: unknown }) => void)[],
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("../_subscriptionManager", () => ({
  createSubscription: (
    _channel: string,
    _table: string,
    _filter: string,
    startInitialLoad: () => void,
    onPayload: (payload: { errors: unknown }) => void,
  ) => {
    mocks.payloadHandlers.push(onPayload);
    startInitialLoad();
    return () => {};
  },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

const snapshot = (name: string): WorldConfigurationDTO => ({
  configuration_customized: true,
  categories: [
    {
      id: "category",
      world_id: "world",
      name,
      icon: null,
      sort_order: 0,
      supports_hierarchy: false,
      supports_map: false,
      supports_bonds: false,
      subtitle_field_definition_id: null,
    },
  ],
  field_definitions: [],
});

let reads: ReturnType<typeof deferred<WorldConfigurationDTO>>[];

beforeEach(() => {
  mocks.payloadHandlers = [];
  reads = [];
  vi.spyOn(
    WorldConfigurationRepository,
    "getWorldConfiguration",
  ).mockImplementation(() => {
    const read = deferred<WorldConfigurationDTO>();
    reads.push(read);
    return read.promise;
  });
});

afterEach(() => vi.restoreAllMocks());

describe("world configuration subscription", () => {
  it("coalesces changes during a read into one newer read", async () => {
    const onConfiguration = vi.fn();
    const subscription =
      WorldConfigurationRepository.listenToWorldConfiguration(
        "world",
        onConfiguration,
        vi.fn(),
      );
    expect(reads).toHaveLength(1);

    mocks.payloadHandlers[0]({ errors: null });
    mocks.payloadHandlers[1]({ errors: null });
    expect(reads).toHaveLength(1);

    // The read that was in flight during the changes is discarded.
    reads[0].resolve(snapshot("Old"));
    await vi.waitFor(() => expect(reads).toHaveLength(2));
    expect(onConfiguration).not.toHaveBeenCalled();

    reads[1].resolve(snapshot("New"));
    await vi.waitFor(() =>
      expect(onConfiguration).toHaveBeenCalledExactlyOnceWith(snapshot("New")),
    );
    subscription.unsubscribe();
  });

  it("resolves a refresh only after a read started after it is delivered", async () => {
    const onConfiguration = vi.fn();
    const subscription =
      WorldConfigurationRepository.listenToWorldConfiguration(
        "world",
        onConfiguration,
        vi.fn(),
      );
    let refreshed = false;
    const refresh = subscription.refresh().then(() => (refreshed = true));

    reads[0].resolve(snapshot("Before edit"));
    await vi.waitFor(() => expect(reads).toHaveLength(2));
    expect(refreshed).toBe(false);

    reads[1].resolve(snapshot("After edit"));
    await refresh;
    expect(onConfiguration).toHaveBeenLastCalledWith(snapshot("After edit"));
    subscription.unsubscribe();
  });
});
