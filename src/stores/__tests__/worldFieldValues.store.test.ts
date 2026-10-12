import { act, renderHook } from "@testing-library/react";
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorldPermission } from "repositories/shared.types";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";
import {
  IWorldEntryFieldValue,
  WorldEntryFieldValuesService,
} from "services/worldEntryFieldValues.service";

import { useWorldStore } from "../world.store";
import {
  useListenToWorldEntries,
  useWorldEntriesStore,
  useWorldEntryFieldValues,
  useWorldFieldValuesByEntry,
} from "../worldEntries.store";

type Payload = Record<string, unknown>;

const mocks = vi.hoisted(() => ({
  selects: [] as { columns: string; filters: [string, string][] }[],
  rows: [] as Record<string, unknown>[],
  subscriptions: [] as {
    table: string;
    filter: string;
    onPayload: (payload: Record<string, unknown>) => void;
    unsubscribe: Mock;
  }[],
}));

vi.mock("lib/supabase.lib", () => ({
  supabase: {
    from: () => ({
      select: (columns: string) => {
        const read = { columns, filters: [] as [string, string][] };
        mocks.selects.push(read);
        const query = {
          eq: (column: string, value: string) => {
            read.filters.push([column, value]);
            return query;
          },
          then: (
            callback: (result: {
              data: unknown[];
              error: null;
              status: number;
            }) => void,
          ) =>
            callback({
              data: mocks.rows.filter((row) =>
                read.filters.every(([column, value]) => row[column] === value),
              ),
              error: null,
              status: 200,
            }),
        };
        return query;
      },
    }),
  },
}));
vi.mock("repositories/_subscriptionManager", async () => {
  const { vi } = await import("vitest");
  return {
    createSubscription: (
      _channel: string,
      table: string,
      filter: string,
      startInitialLoad: () => void,
      onPayload: (payload: Record<string, unknown>) => void,
    ) => {
      const unsubscribe = vi.fn();
      mocks.subscriptions.push({ table, filter, onPayload, unsubscribe });
      startInitialLoad();
      return unsubscribe;
    },
  };
});

const row = (
  entryId: string,
  fieldDefinitionId: string,
  value: string,
  extra: Payload = {},
) => ({
  entry_id: entryId,
  field_definition_id: fieldDefinitionId,
  world_id: "world",
  gm_only: false,
  value,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...extra,
});

const entry = (id: string) => ({ id }) as IWorldEntry;

// Starts the entries listener against a stub and returns its delivery hook.
function listenToEntries() {
  let deliver: Parameters<
    typeof WorldEntriesService.listenToWorldEntries
  >[3] = () => {};
  vi.spyOn(WorldEntriesService, "listenToWorldEntries").mockImplementation(
    (_uid, _worldId, _permission, onChanges) => {
      deliver = onChanges;
      return () => {};
    },
  );
  store().listenToWorldEntries("uid", "world", WorldPermission.Player);
  return (
    changed: Record<string, IWorldEntry>,
    removed: string[],
    replace: boolean,
  ) => act(() => deliver(changed, removed, replace));
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

const store = () => useWorldEntriesStore.getState();
const values = () => store().fieldValueState.valuesByEntry;
const send = (payload: Payload) =>
  act(() =>
    mocks.subscriptions
      .find((s) => s.table === "world_entry_field_values")!
      .onPayload({ errors: null, ...payload }),
  );

beforeEach(() => {
  mocks.selects = [];
  mocks.rows = [];
  mocks.subscriptions = [];
});

afterEach(() => {
  store().reset();
  vi.restoreAllMocks();
});

describe("world field values", () => {
  it("loads every value in the world without rich text content", () => {
    mocks.rows = [row("a", "f1", "one"), row("b", "f1", "two")];
    const unsubscribe = store().listenToWorldFieldValues("world");

    const read = mocks.selects[0];
    expect(read.filters).toEqual([["world_id", "world"]]);
    expect(read.columns.split(",").map((c) => c.trim())).not.toContain(
      "content",
    );
    expect(mocks.subscriptions[0].filter).toBe("world_id=eq.world");
    expect(values()).toEqual({
      a: {
        f1: {
          entryId: "a",
          fieldDefinitionId: "f1",
          worldId: "world",
          gmOnly: false,
          value: "one",
        },
      },
      b: {
        f1: expect.objectContaining({ entryId: "b", value: "two" }),
      },
    });
    expect(store().fieldValueState.loading).toBe(false);
    unsubscribe();
  });

  it("applies inserts, updates and deletes across entries", () => {
    mocks.rows = [row("a", "f1", "one")];
    store().listenToWorldFieldValues("world");

    send({ eventType: "INSERT", new: row("b", "f1", "two"), old: {} });
    send({ eventType: "INSERT", new: row("a", "f2", "three"), old: {} });
    send({ eventType: "UPDATE", new: row("a", "f1", "uno"), old: {} });
    expect(values().a.f1.value).toBe("uno");
    expect(values().a.f2.value).toBe("three");
    expect(values().b.f1.value).toBe("two");

    // With RLS on, a delete's old record carries only the primary key.
    send({
      eventType: "DELETE",
      new: {},
      old: { entry_id: "a", field_definition_id: "f2" },
    });
    send({
      eventType: "DELETE",
      new: {},
      old: { entry_id: "b", field_definition_id: "f1" },
    });
    expect(Object.keys(values().a)).toEqual(["f1"]);
    expect(values().b).toBeUndefined();

    // Deletes for rows this client never held are ignored.
    send({
      eventType: "DELETE",
      new: {},
      old: { entry_id: "elsewhere", field_definition_id: "f1" },
    });
    expect(Object.keys(values())).toEqual(["a"]);
  });

  it("keeps realtime rich text content out of the store", () => {
    store().listenToWorldFieldValues("world");
    send({
      eventType: "INSERT",
      new: row("a", "notes", "", { content: "\\x0102" }),
      old: {},
    });
    expect(values().a.notes).not.toHaveProperty("content");
  });

  it("drops an entry's values when the entry is removed", () => {
    mocks.rows = [row("a", "f1", "one"), row("b", "f1", "two")];
    const deliverEntries = listenToEntries();
    store().listenToWorldFieldValues("world");
    deliverEntries({ a: entry("a"), b: entry("b") }, [], true);

    deliverEntries({}, ["a"], false);
    expect(Object.keys(values())).toEqual(["b"]);
  });

  it("drops a late read from a previous world", () => {
    const deliveries: Record<
      string,
      Parameters<
        typeof WorldEntryFieldValuesService.listenToWorldFieldValues
      >[1]
    > = {};
    vi.spyOn(
      WorldEntryFieldValuesService,
      "listenToWorldFieldValues",
    ).mockImplementation((worldId, onChanges) => {
      deliveries[worldId] = onChanges;
      return () => {};
    });
    const value = (worldId: string): IWorldEntryFieldValue => ({
      entryId: "a",
      fieldDefinitionId: "f1",
      worldId,
      gmOnly: false,
      value: worldId,
    });

    store().listenToWorldFieldValues("world");
    store().reset();
    store().listenToWorldFieldValues("other");
    act(() => deliveries.world([value("world")], [], true));
    expect(values()).toEqual({});
    expect(store().fieldValueState.loading).toBe(true);

    act(() => deliveries.other([value("other")], [], true));
    expect(values().a.f1.value).toBe("other");
  });
});

describe("entries that become readable", () => {
  it("loads the existing values of an entry newly visible to this player", async () => {
    mocks.rows = [row("a", "f1", "one")];
    const deliverEntries = listenToEntries();
    store().listenToWorldFieldValues("world");
    deliverEntries({ a: entry("a") }, [], true);

    // A guide opens a guides-only entry to all players: only the entry row
    // changes, so its values arrive through a one-off read.
    mocks.rows.push(row("c", "f1", "secret"), row("c", "f2", "plans"));
    deliverEntries({ c: entry("c") }, [], false);
    await vi.waitFor(() => expect(values().c?.f2?.value).toBe("plans"));
    expect(values().c.f1.value).toBe("secret");
    const read = mocks.selects.at(-1)!;
    expect(read.filters).toEqual([["entry_id", "c"]]);
    expect(read.columns).not.toMatch(/\bcontent\b/);
  });

  it("reads only for entries it did not already hold", () => {
    const read = vi
      .spyOn(WorldEntryFieldValuesService, "getWorldEntryFieldValues")
      .mockResolvedValue([]);
    const deliverEntries = listenToEntries();
    store().listenToWorldFieldValues("world");

    deliverEntries({ a: entry("a") }, [], true);
    deliverEntries({ a: entry("a") }, [], false);
    expect(read).not.toHaveBeenCalled();

    deliverEntries({ b: entry("b") }, [], false);
    expect(read).toHaveBeenCalledExactlyOnceWith("b");
  });

  it("keeps values realtime delivered while the read was in flight", async () => {
    const pending = deferred<IWorldEntryFieldValue[]>();
    vi.spyOn(
      WorldEntryFieldValuesService,
      "getWorldEntryFieldValues",
    ).mockReturnValue(pending.promise);
    const deliverEntries = listenToEntries();
    store().listenToWorldFieldValues("world");

    deliverEntries({ c: entry("c") }, [], false);
    send({ eventType: "UPDATE", new: row("c", "f1", "newer"), old: {} });
    await act(async () =>
      pending.resolve([
        { ...values().c.f1, value: "older" },
        { ...values().c.f1, fieldDefinitionId: "f2", value: "other" },
      ]),
    );
    expect(values().c.f1.value).toBe("newer");
    expect(values().c.f2.value).toBe("other");
  });

  it("ignores a read that resolves after the entry is hidden again", async () => {
    const pending = deferred<IWorldEntryFieldValue[]>();
    vi.spyOn(
      WorldEntryFieldValuesService,
      "getWorldEntryFieldValues",
    ).mockReturnValue(pending.promise);
    const deliverEntries = listenToEntries();
    store().listenToWorldFieldValues("world");

    deliverEntries({ c: entry("c") }, [], false);
    deliverEntries({}, ["c"], false);
    await act(async () =>
      pending.resolve([
        {
          entryId: "c",
          fieldDefinitionId: "f1",
          worldId: "world",
          gmOnly: false,
          value: "secret",
        },
      ]),
    );
    expect(values()).toEqual({});
  });

  it("ignores a read that resolves after the world changes", async () => {
    const pending = deferred<IWorldEntryFieldValue[]>();
    vi.spyOn(
      WorldEntryFieldValuesService,
      "getWorldEntryFieldValues",
    ).mockReturnValue(pending.promise);
    const deliverEntries = listenToEntries();
    store().listenToWorldFieldValues("world");

    deliverEntries({ c: entry("c") }, [], false);
    act(() => store().reset());
    store().listenToWorldFieldValues("other");
    useWorldEntriesStore.setState((state) => {
      state.entryState.entries = { c: entry("c") };
    });
    await act(async () =>
      pending.resolve([
        {
          entryId: "c",
          fieldDefinitionId: "f1",
          worldId: "world",
          gmOnly: false,
          value: "secret",
        },
      ]),
    );
    expect(values()).toEqual({});
  });
});

describe("world field value listeners", () => {
  beforeEach(() => {
    vi.spyOn(WorldEntriesService, "listenToWorldEntries").mockReturnValue(
      () => {},
    );
    useWorldStore.setState({ worldPermission: WorldPermission.Player });
  });

  it("start and stop with entries and clear on a world change", () => {
    mocks.rows = [row("a", "f1", "one")];
    const hook = renderHook(({ worldId }) => useListenToWorldEntries(worldId), {
      initialProps: { worldId: "world" },
    });
    expect(WorldEntriesService.listenToWorldEntries).toHaveBeenCalledOnce();
    expect(mocks.subscriptions).toHaveLength(1);
    expect(values().a.f1.value).toBe("one");

    mocks.rows = [];
    hook.rerender({ worldId: "other" });
    expect(mocks.subscriptions[0].unsubscribe).toHaveBeenCalledOnce();
    expect(mocks.subscriptions[1].filter).toBe("world_id=eq.other");
    expect(values()).toEqual({});

    hook.unmount();
    expect(mocks.subscriptions[1].unsubscribe).toHaveBeenCalledOnce();
  });

  it("keeps one entry's values stable while other entries change", () => {
    mocks.rows = [row("a", "f1", "one")];
    store().listenToWorldFieldValues("world");

    const entry = renderHook(() => useWorldEntryFieldValues("a"));
    const missing = renderHook(() => useWorldEntryFieldValues("missing"));
    const all = renderHook(() => useWorldFieldValuesByEntry());
    const [entryValues, missingValues] = [
      entry.result.current,
      missing.result.current,
    ];
    expect(missingValues).toEqual({});

    send({ eventType: "INSERT", new: row("b", "f1", "two"), old: {} });
    expect(entry.result.current).toBe(entryValues);
    expect(missing.result.current).toBe(missingValues);
    expect(Object.keys(all.result.current)).toEqual(["a", "b"]);

    send({ eventType: "UPDATE", new: row("a", "f1", "uno"), old: {} });
    expect(entry.result.current.f1.value).toBe("uno");
    [entry, missing, all].forEach((hook) => hook.unmount());
  });
});
