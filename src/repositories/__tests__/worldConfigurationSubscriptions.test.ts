import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSubscription } from "../_subscriptionManager";
import { WorldCategoriesRepository } from "../worldCategories.repository";
import { WorldFieldDefinitionsRepository } from "../worldFieldDefinitions.repository";

const mocks = vi.hoisted(() => ({ from: vi.fn(), query: vi.fn() }));
vi.mock("lib/supabase.lib", () => ({ supabase: { from: mocks.from } }));
vi.mock("../_subscriptionManager", () => ({ createSubscription: vi.fn() }));

function row(id: string, label = id) {
  return {
    id,
    name: label,
    label,
    world_id: "world",
    category_id: "category",
    created_at: "2026-10-04",
    updated_at: "2026-10-04",
    sort_order: 0,
    icon: null,
    subtitle_field_definition_id: null,
    supports_bonds: false,
    supports_hierarchy: false,
    supports_map: false,
    binding: null,
    configuration: {},
    gm_only: false,
    key: id,
    type: "text",
  };
}
type Row = ReturnType<typeof row>;
type QueryResult = {
  data: Row[] | null;
  error: { message: string } | null;
  status: number;
};

function deferred() {
  let resolve: (value: QueryResult) => void = () => {};
  const promise = new Promise<QueryResult>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return {
    promise,
    rows: (rows: Row[]) => resolve({ data: rows, error: null, status: 200 }),
    error: () =>
      resolve({ data: null, error: { message: "read failed" }, status: 500 }),
  };
}

const repositories = [
  {
    table: "world_categories",
    listen: WorldCategoriesRepository.listenToWorldCategories.bind(
      WorldCategoriesRepository,
    ),
  },
  {
    table: "world_field_definitions",
    listen: WorldFieldDefinitionsRepository.listenToWorldFieldDefinitions.bind(
      WorldFieldDefinitionsRepository,
    ),
  },
];

describe.each(repositories)(
  "$table collection subscription",
  ({ table, listen }) => {
    let load: () => void;
    let payload: (payload: RealtimePostgresChangesPayload<Row>) => void;
    const changes = vi.fn();
    const onError = vi.fn();
    const unsubscribe = vi.fn();
    const cleanups: Array<() => void> = [];
    const flush = async () => {
      await vi.waitFor(() =>
        expect(changes.mock.calls.filter((call) => call[2])).toHaveLength(1),
      );
    };
    const update = (value: Row) =>
      payload({
        schema: "public",
        table,
        commit_timestamp: "now",
        errors: [],
        eventType: "UPDATE",
        old: {},
        new: value,
      });
    const remove = (id: string) =>
      payload({
        schema: "public",
        table,
        commit_timestamp: "now",
        errors: [],
        eventType: "DELETE",
        old: { id },
        new: {},
      });

    beforeEach(() => {
      vi.clearAllMocks();
      mocks.from.mockReturnValue({ select: () => ({ eq: mocks.query }) });
      vi.mocked(createSubscription).mockImplementation(
        (_name, _table, _filter, initialLoad, onPayload) => {
          load = initialLoad;
          payload = onPayload;
          initialLoad();
          return unsubscribe;
        },
      );
    });
    afterEach(() => {
      cleanups.splice(0).forEach((cleanup) => cleanup());
      vi.restoreAllMocks();
    });

    it("opts into handshake and reconnect snapshots", async () => {
      const first = deferred();
      const reconnect = deferred();
      mocks.query
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(reconnect.promise);
      cleanups.push(listen("world", changes, onError));
      first.rows([row("one")]);
      await flush();
      changes.mockClear();
      load();
      reconnect.rows([row("two")]);
      await flush();
      expect(changes).toHaveBeenCalledExactlyOnceWith(
        { two: row("two") },
        [],
        true,
      );
      expect(createSubscription).toHaveBeenCalledWith(
        `${table}:world_id=eq.world`,
        table,
        "world_id=eq.world",
        expect.any(Function),
        expect.any(Function),
        { refreshOnSubscribe: true },
      );
    });

    it("preserves baseline rows while overlaying newer upserts and deletions during the initial read", async () => {
      const initial = deferred();
      mocks.query.mockReturnValue(initial.promise);
      cleanups.push(listen("world", changes, onError));
      update(row("updated", "newer"));
      update(row("added"));
      remove("deleted");
      update(row("recreated", "newer"));
      remove("recreated");
      update(row("recreated", "latest"));
      initial.rows([
        row("baseline"),
        row("updated", "older"),
        row("deleted"),
        row("recreated", "older"),
      ]);
      await flush();
      expect(changes).toHaveBeenLastCalledWith(
        {
          baseline: row("baseline"),
          updated: row("updated", "newer"),
          added: row("added"),
          recreated: row("recreated", "latest"),
        },
        [],
        true,
      );
      expect(changes).toHaveBeenCalledWith({}, ["deleted"], false);
      expect(changes).toHaveBeenCalledWith(
        { updated: row("updated", "newer") },
        [],
        false,
      );
      expect(onError).not.toHaveBeenCalled();
    });

    it.each(["rows", "error"] as const)(
      "ignores superseded reconnect %s",
      async (completion) => {
        const old = deferred();
        const latest = deferred();
        mocks.query
          .mockReturnValueOnce(old.promise)
          .mockReturnValueOnce(latest.promise);
        cleanups.push(listen("world", changes, onError));
        load();
        update(row("latest", "live"));
        latest.rows([row("baseline"), row("latest", "query")]);
        if (completion === "rows") old.rows([row("stale")]);
        else old.error();
        await flush();
        expect(changes).toHaveBeenLastCalledWith(
          { baseline: row("baseline"), latest: row("latest", "live") },
          [],
          true,
        );
        expect(onError).not.toHaveBeenCalled();
      },
    );

    it.each(["rows", "error"] as const)(
      "ignores late %s and realtime events after cleanup",
      async (completion) => {
        const pending = deferred();
        mocks.query.mockReturnValue(pending.promise);
        const cleanup = listen("world", changes, onError);
        cleanup();
        if (completion === "rows") pending.rows([row("late")]);
        else pending.error();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        update(row("late"));
        remove("late");
        expect(changes).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
        expect(unsubscribe).toHaveBeenCalledTimes(1);
      },
    );
  },
);
