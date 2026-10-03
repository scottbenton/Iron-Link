import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorldCategoriesService } from "services/worldCategories.service";
import { WorldConfigurationReadService } from "services/worldConfigurationRead.service";
import { WorldFieldDefinitionsService } from "services/worldFieldDefinitions.service";

import {
  useListenToWorldCategories,
  useWorldCategoriesStore,
} from "../worldCategories.store";
import { createStoreConfigurationFixture } from "./worldConfiguration.fixture";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("lib/supabase.lib", () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock("../world.store", () => ({ useWorldStore: vi.fn() }));

const world = {
  id: "09c0d230-3f90-4acb-a407-c8b99e074a2c",
  settingKey: "world:starforged/forge",
  configurationCustomized: false,
};
const store = () => useWorldCategoriesStore.getState();

beforeEach(() => {
  vi.restoreAllMocks();
  mocks.rpc
    .mockReset()
    .mockResolvedValue({ data: null, error: null, status: 200 });
  store().reset();
  vi.spyOn(
    WorldConfigurationReadService,
    "getWorldConfiguration",
  ).mockImplementation(async (worldId) => ({
    ...createStoreConfigurationFixture(worldId),
    configurationCustomized: false,
  }));
});

async function listenToDefaults(worldToLoad = world) {
  const stop = store().listenToWorldCategories(worldToLoad);
  await vi.waitFor(() => expect(store().configurationLoaded).toBe(true));
  return stop;
}

describe("world configuration source", () => {
  it("reads database defaults without subscribing or writing, including for readers", async () => {
    const categories = vi.spyOn(
      WorldCategoriesService,
      "listenToWorldCategories",
    );
    const fields = vi.spyOn(
      WorldFieldDefinitionsService,
      "listenToWorldFieldDefinitions",
    );
    const stop = await listenToDefaults();
    expect(
      Object.values(store().categories).map((category) => category.name),
    ).toEqual(["Places", "People", "Notes"]);
    expect(store().loading).toBe(false);
    expect(store().configurationCustomized).toBe(false);
    expect(categories).not.toHaveBeenCalled();
    expect(fields).not.toHaveBeenCalled();
    expect(
      WorldConfigurationReadService.getWorldConfiguration,
    ).toHaveBeenCalledWith(world.id);
    expect(mocks.rpc).not.toHaveBeenCalled();
    stop();
  });

  it("resolves database defaults afresh without changing identities or mutating source definitions", async () => {
    await listenToDefaults();
    const original = createStoreConfigurationFixture(world.id);
    const source = "oracle_rollable:starforged/character/goal";
    const target = "oracle_rollable:starsmith/character/goal";
    store().applyDefaultReplacementMap(world.id, { [source]: target });
    expect(Object.keys(store().fieldDefinitions)).toEqual(
      Object.keys(original.fieldDefinitions),
    );
    const goal = Object.values(store().fieldDefinitions).find(
      (field) => field.key === "goal",
    )!;
    expect(goal.binding?.resolvedOracleId).toBe(target);
    expect(store().sourceFieldDefinitions).toEqual(original.fieldDefinitions);
    store().applyDefaultReplacementMap(world.id, {});
    expect(store().fieldDefinitions[goal.id].binding?.resolvedOracleId).toBe(
      source,
    );
  });

  it("keeps read-only counts separate and sends first edit plus resolved binding snapshot atomically", async () => {
    await listenToDefaults();
    store().applyDefaultReplacementMap(world.id, {});
    const category = Object.values(store().categories)[0];
    mocks.rpc.mockResolvedValueOnce({
      data: { entryCount: 0, valueCounts: {} },
      error: null,
      status: 200,
    });
    await WorldCategoriesService.getCategoryCounts(world.id, category.id);
    expect(mocks.rpc).toHaveBeenLastCalledWith("get_world_category_counts", {
      p_world_id: world.id,
      p_category_id: category.id,
    });
    expect(store().configurationCustomized).toBe(false);
    await store().updateCategory(category.id, { name: "Places" });
    expect(mocks.rpc).toHaveBeenLastCalledWith(
      "mutate_world_configuration",
      expect.objectContaining({
        p_world_id: world.id,
        p_operation: {
          type: "update_category",
          id: category.id,
          changes: expect.objectContaining({ name: "Places" }),
        },
        p_default_bindings: expect.arrayContaining([
          expect.objectContaining({
            id: Object.keys(store().fieldDefinitions)[0],
          }),
        ]),
      }),
    );
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    // Only the authoritative world row flips the source after the transaction commits.
    expect(store().configurationCustomized).toBe(false);
  });

  it("preserves a rule's explicit unbound fallback through resolution and the first edit", async () => {
    const defaults = createStoreConfigurationFixture(world.id);
    const goal = Object.values(defaults.fieldDefinitions).find(
      (field) => field.key === "goal",
    )!;
    const source = Object.values(defaults.fieldDefinitions).find(
      (field) => field.categoryId === goal.categoryId && field.type === "text",
    )!;
    goal.configuration.rules = [
      {
        conditions: [
          { source: "entry", fieldId: source.id, operator: "isEmpty" },
        ],
        binding: null,
      },
    ];
    vi.mocked(
      WorldConfigurationReadService.getWorldConfiguration,
    ).mockResolvedValueOnce({
      ...defaults,
      configurationCustomized: false,
    });
    await listenToDefaults();
    store().applyDefaultReplacementMap(world.id, {});
    expect(
      store().fieldDefinitions[goal.id].configuration.rules[0].binding,
    ).toBeNull();
    await store().updateCategory(Object.keys(defaults.categories)[0], {
      name: "Places",
    });
    expect(mocks.rpc).toHaveBeenLastCalledWith(
      "mutate_world_configuration",
      expect.objectContaining({
        p_default_bindings: expect.arrayContaining([
          expect.objectContaining({
            id: goal.id,
            rule_bindings: [
              expect.objectContaining({ index: 0, binding: null }),
            ],
          }),
        ]),
      }),
    );
  });

  it("routes a first reorder through the same atomic fork, and blocks edits with stale binding resolution", async () => {
    await listenToDefaults();
    store().applyDefaultReplacementMap(world.id, {});
    const ids = Object.keys(store().categories).reverse();
    await store().reorderCategories(ids);
    expect(mocks.rpc).toHaveBeenLastCalledWith(
      "mutate_world_configuration",
      expect.objectContaining({
        p_operation: { type: "reorder_categories", ids },
        p_default_bindings: expect.any(Array),
      }),
    );
    store().invalidateDefaultBindings(world.id);
    expect(() => store().deleteCategory(ids[0])).toThrow(/finish loading/);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it("waits for both custom snapshots and never resurrects deleted defaults", async () => {
    let categoriesChanged: Parameters<
      typeof WorldCategoriesService.listenToWorldCategories
    >[1];
    let fieldsChanged: Parameters<
      typeof WorldFieldDefinitionsService.listenToWorldFieldDefinitions
    >[1];
    const stopCategories = vi.fn();
    const stopFields = vi.fn();
    vi.spyOn(
      WorldCategoriesService,
      "listenToWorldCategories",
    ).mockImplementation((_id, callback) => {
      categoriesChanged = callback;
      return stopCategories;
    });
    vi.spyOn(
      WorldFieldDefinitionsService,
      "listenToWorldFieldDefinitions",
    ).mockImplementation((_id, callback) => {
      fieldsChanged = callback;
      return stopFields;
    });
    store().listenToWorldCategories(world)();
    const stop = store().listenToWorldCategories({
      ...world,
      configurationCustomized: true,
    });
    categoriesChanged!({}, [], true);
    expect(store().loading).toBe(true);
    fieldsChanged!({}, [], true);
    expect(store().loading).toBe(false);
    expect(store().categories).toEqual({});
    expect(store().fieldDefinitions).toEqual({});
    store().applyDefaultReplacementMap(world.id, {});
    expect(store().categories).toEqual({});
    stop();
    await listenToDefaults({
      ...world,
      id: "3325bfc5-2c3d-41e2-8068-70b61d4bccdd",
    });
    categoriesChanged!({}, [], true);
    fieldsChanged!({}, [], true);
    expect(Object.keys(store().categories)).toHaveLength(
      Object.keys(createStoreConfigurationFixture(world.id).categories).length,
    );
    expect(stopCategories).toHaveBeenCalledOnce();
    expect(stopFields).toHaveBeenCalledOnce();
  });

  it("discards a database response after switching worlds", async () => {
    let resolveOld!: (
      snapshot: Awaited<
        ReturnType<typeof WorldConfigurationReadService.getWorldConfiguration>
      >,
    ) => void;
    vi.mocked(
      WorldConfigurationReadService.getWorldConfiguration,
    ).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const stopOld = store().listenToWorldCategories(world);
    const next = { ...world, id: "3325bfc5-2c3d-41e2-8068-70b61d4bccdd" };
    await listenToDefaults(next);
    const nextCategories = store().categories;
    resolveOld({
      ...createStoreConfigurationFixture(world.id),
      configurationCustomized: false,
    });
    await Promise.resolve();
    expect(store().worldId).toBe(next.id);
    expect(store().categories).toEqual(nextCategories);
    stopOld();
  });

  it.each(["success", "failure"])(
    "ignores a late inherited request %s after customization",
    async (outcome) => {
      let resolveOld!: (
        snapshot: Awaited<
          ReturnType<typeof WorldConfigurationReadService.getWorldConfiguration>
        >,
      ) => void;
      let rejectOld!: (cause: Error) => void;
      vi.mocked(
        WorldConfigurationReadService.getWorldConfiguration,
      ).mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            resolveOld = resolve;
            rejectOld = reject;
          }),
      );
      const stopOld = store().listenToWorldCategories(world);
      const custom = customWorld();
      custom.categoriesChanged({}, [], true);
      custom.fieldsChanged({}, [], true);
      if (outcome === "success")
        resolveOld({
          ...createStoreConfigurationFixture(world.id),
          configurationCustomized: true,
        });
      else rejectOld(new Error("Old read failed"));
      await Promise.resolve();
      await Promise.resolve();
      expect(store().configurationCustomized).toBe(true);
      expect(store().categories).toEqual({});
      expect(store().error).toBeUndefined();
      stopOld();
    },
  );
});

afterEach(() => {
  store().reset();
  vi.useRealTimers();
});

function deferred() {
  let resolve!: () => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function customWorld() {
  let categoriesChanged!: Parameters<
    typeof WorldCategoriesService.listenToWorldCategories
  >[1];
  let fieldsChanged!: Parameters<
    typeof WorldFieldDefinitionsService.listenToWorldFieldDefinitions
  >[1];
  vi.spyOn(
    WorldCategoriesService,
    "listenToWorldCategories",
  ).mockImplementation((_id, callback) => {
    categoriesChanged = callback;
    return () => {};
  });
  vi.spyOn(
    WorldFieldDefinitionsService,
    "listenToWorldFieldDefinitions",
  ).mockImplementation((_id, callback) => {
    fieldsChanged = callback;
    return () => {};
  });
  const defaults = createStoreConfigurationFixture(world.id);
  const listen = (emitSnapshots = true) => {
    store().listenToWorldCategories({
      ...world,
      configurationCustomized: true,
    });
    if (emitSnapshots) {
      categoriesChanged(defaults.categories, [], true);
      fieldsChanged(defaults.fieldDefinitions, [], true);
    }
  };
  listen();
  return {
    defaults,
    listen,
    categoriesChanged: (...args: Parameters<typeof categoriesChanged>) =>
      categoriesChanged(...args),
    fieldsChanged: (...args: Parameters<typeof fieldsChanged>) =>
      fieldsChanged(...args),
  };
}
const categoryIds = () =>
  Object.values(store().categories)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((record) => record.id);
const fieldIds = (categoryId: string) =>
  Object.values(store().fieldDefinitions)
    .filter((field) => field.categoryId === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((record) => record.id);

describe("successful category creation before realtime", () => {
  it("makes the returned category available immediately and retains it through first-fork subscription handover", async () => {
    const fixture = customWorld();
    await listenToDefaults();
    store().applyDefaultReplacementMap(world.id, {});
    let complete!: (id: string) => void;
    vi.spyOn(WorldCategoriesService, "addWorldCategory").mockReturnValue(
      new Promise<string>((resolve) => {
        complete = resolve;
      }),
    );
    const save = store().createCategory(world.id, {
      name: "Creatures",
      sortOrder: 4,
    });
    expect(store().categories["created-id"]).toBeUndefined();
    complete("created-id");
    expect(await save).toBe("created-id");
    const created = store().categories["created-id"];
    expect(created).toMatchObject({
      id: "created-id",
      worldId: world.id,
      name: "Creatures",
      sortOrder: 4,
      icon: null,
      supportsHierarchy: false,
      supportsMap: false,
      supportsBonds: false,
      subtitleFieldDefinitionId: null,
    });
    fixture.listen(false);
    expect(store().categories[created.id]).toEqual(created);
    fixture.categoriesChanged(
      {
        ...fixture.defaults.categories,
        [created.id]: { ...created, name: "Authoritative name" },
      },
      [],
      true,
    );
    expect(store().categories[created.id].name).toBe("Authoritative name");
  });

  it("keeps an authoritative record received before the create request resolves", async () => {
    const fixture = customWorld();
    let complete!: (id: string) => void;
    vi.spyOn(WorldCategoriesService, "addWorldCategory").mockReturnValue(
      new Promise<string>((resolve) => {
        complete = resolve;
      }),
    );
    const save = store().createCategory(world.id, {
      name: "Creatures",
      sortOrder: 4,
    });
    const authoritative = {
      ...Object.values(fixture.defaults.categories)[0],
      id: "created-id",
      name: "Latest server name",
    };
    fixture.categoriesChanged({ [authoritative.id]: authoritative }, [], false);
    complete(authoritative.id);
    await save;
    expect(store().categories[authoritative.id]).toEqual(authoritative);
  });

  it.each(["delete event", "replacement snapshot", "first-fork handover"])(
    "does not restore a category removed via %s before its create response",
    async (removal) => {
      const fixture = customWorld();
      if (removal === "first-fork handover") {
        await listenToDefaults();
        store().applyDefaultReplacementMap(world.id, {});
      }
      let complete!: (id: string) => void;
      vi.spyOn(WorldCategoriesService, "addWorldCategory").mockReturnValue(
        new Promise<string>((resolve) => {
          complete = resolve;
        }),
      );
      const save = store().createCategory(world.id, {
        name: "Creatures",
        sortOrder: 4,
      });
      if (removal === "first-fork handover") fixture.listen(false);
      const created = {
        ...Object.values(fixture.defaults.categories)[0],
        id: "created-id",
        name: "Creatures",
      };
      fixture.categoriesChanged({ [created.id]: created }, [], false);
      if (removal === "replacement snapshot")
        fixture.categoriesChanged(fixture.defaults.categories, [], true);
      else fixture.categoriesChanged({}, [created.id], false);
      expect(store().categories[created.id]).toBeUndefined();
      complete(created.id);
      expect(await save).toBe(created.id);
      expect(store().categories[created.id]).toBeUndefined();
    },
  );

  it("does not seed an old session after switching away and back to the same world", async () => {
    const fixture = customWorld();
    let complete!: (id: string) => void;
    vi.spyOn(WorldCategoriesService, "addWorldCategory").mockReturnValue(
      new Promise<string>((resolve) => {
        complete = resolve;
      }),
    );
    const save = store().createCategory(world.id, {
      name: "Creatures",
      sortOrder: 4,
    });
    store().listenToWorldCategories({
      ...world,
      id: "3325bfc5-2c3d-41e2-8068-70b61d4bccdd",
    });
    fixture.listen();
    complete("created-id");
    await save;
    expect(store().categories["created-id"]).toBeUndefined();
  });

  it.each(["failed", "switched world"])(
    "never seeds a category after a %s create",
    async (outcome) => {
      customWorld();
      let complete!: (id: string) => void, reject!: (cause: Error) => void;
      vi.spyOn(WorldCategoriesService, "addWorldCategory").mockReturnValue(
        new Promise<string>((yes, no) => {
          complete = yes;
          reject = no;
        }),
      );
      const save = store().createCategory(world.id, {
        name: "Creatures",
        sortOrder: 4,
      });
      if (outcome === "failed") {
        const failed = expect(save).rejects.toThrow("Create failed");
        reject(new Error("Create failed"));
        await failed;
      } else {
        store().listenToWorldCategories({
          ...world,
          id: "3325bfc5-2c3d-41e2-8068-70b61d4bccdd",
        });
        complete("created-id");
        await save;
      }
      expect(store().categories["created-id"]).toBeUndefined();
    },
  );
});

describe("optimistic configuration ordering", () => {
  it("shows a category drag immediately and protects it until server echo, while merging other realtime changes", async () => {
    const fixture = customWorld();
    const request = deferred();
    vi.spyOn(WorldCategoriesService, "reorderCategories").mockReturnValue(
      request.promise,
    );
    const original = categoryIds();
    const ids = [...original].reverse();
    const save = store().reorderCategories(ids);
    expect(categoryIds()).toEqual(ids);
    const renamed = {
      ...fixture.defaults.categories[original[0]],
      name: "Renamed remotely",
    };
    fixture.categoriesChanged({ [renamed.id]: renamed }, [], false);
    expect(categoryIds()).toEqual(ids);
    expect(store().categories[renamed.id].name).toBe(renamed.name);
    request.resolve();
    await save;
    fixture.categoriesChanged(fixture.defaults.categories, [], true);
    expect(categoryIds()).toEqual(ids);
    fixture.categoriesChanged(
      Object.fromEntries(
        ids.map((id, sortOrder) => [
          id,
          { ...fixture.defaults.categories[id], sortOrder },
        ]),
      ),
      [],
      true,
    );
    fixture.categoriesChanged(fixture.defaults.categories, [], true);
    expect(categoryIds()).toEqual(original); // A later external reorder is authoritative.
  });

  it("rolls failed field ordering back without reverting new labels, resurrecting deletions, or touching other categories", async () => {
    const fixture = customWorld();
    const request = deferred();
    vi.spyOn(WorldCategoriesService, "reorderFields").mockReturnValue(
      request.promise,
    );
    const categoryId = categoryIds()[0];
    const original = fieldIds(categoryId);
    const other = Object.values(store().fieldDefinitions).find(
      (field) => field.categoryId !== categoryId,
    )!;
    const save = store().reorderFields(categoryId, [...original].reverse());
    const failed = expect(save).rejects.toThrow("Save failed");
    expect(fieldIds(categoryId)).toEqual([...original].reverse());
    fixture.fieldsChanged(
      {
        [original[0]]: {
          ...fixture.defaults.fieldDefinitions[original[0]],
          label: "Latest label",
          sortOrder: 42,
        },
      },
      [original[1]],
      false,
    );
    request.reject(new Error("Save failed"));
    await failed;
    expect(fieldIds(categoryId)).toEqual([
      ...original.filter((id) => id !== original[0] && id !== original[1]),
      original[0],
    ]);
    expect(store().fieldDefinitions[original[0]].sortOrder).toBe(42);
    expect(store().fieldDefinitions[original[0]].label).toBe("Latest label");
    expect(store().fieldDefinitions[original[1]]).toBeUndefined();
    expect(store().fieldDefinitions[other.id]).toEqual(other);
  });

  it("serializes overlapping drags and keeps the newest optimistic order when an older request fails", async () => {
    customWorld();
    const first = deferred(),
      second = deferred();
    const reorder = vi
      .spyOn(WorldCategoriesService, "reorderCategories")
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const original = categoryIds();
    const firstSave = store().reorderCategories([...original].reverse());
    const failed = expect(firstSave).rejects.toThrow("Older failed");
    const desired = [original[1], original[0], ...original.slice(2)];
    const secondSave = store().reorderCategories(desired);
    await Promise.resolve();
    expect(reorder).toHaveBeenCalledTimes(1);
    first.reject(new Error("Older failed"));
    await failed;
    expect(categoryIds()).toEqual(desired);
    await Promise.resolve();
    expect(reorder).toHaveBeenCalledTimes(2);
    second.resolve();
    await secondSave;
    expect(categoryIds()).toEqual(desired);
  });

  it("restores the last successful drag if the next queued drag fails", async () => {
    customWorld();
    const first = deferred(),
      second = deferred();
    vi.spyOn(WorldCategoriesService, "reorderCategories")
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const original = categoryIds();
    const saved = [...original].reverse();
    const firstSave = store().reorderCategories(saved);
    const secondSave = store().reorderCategories(original);
    const failed = expect(secondSave).rejects.toThrow("Latest failed");
    first.resolve();
    await firstSave;
    second.reject(new Error("Latest failed"));
    await failed;
    expect(categoryIds()).toEqual(saved);
  });

  it("reserves gesture order before synchronous subscribers start another drag", async () => {
    customWorld();
    const first = deferred(),
      second = deferred();
    const reorder = vi
      .spyOn(WorldCategoriesService, "reorderCategories")
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const original = categoryIds();
    const firstIds = [...original].reverse();
    const latestIds = [original[1], original[0], ...original.slice(2)];
    let latestSave: Promise<void> | undefined;
    const unsubscribe = useWorldCategoriesStore.subscribe(() => {
      if (!latestSave && categoryIds().join() === firstIds.join())
        latestSave = store().reorderCategories(latestIds);
    });
    const firstSave = store().reorderCategories(firstIds);
    unsubscribe();
    await Promise.resolve();
    expect(reorder).toHaveBeenCalledWith(world.id, firstIds, undefined);
    expect(reorder).toHaveBeenCalledTimes(1);
    first.resolve();
    await firstSave;
    second.resolve();
    await latestSave;
    expect(reorder.mock.calls.map((call) => call[1])).toEqual([
      firstIds,
      latestIds,
    ]);
    expect(categoryIds()).toEqual(latestIds);
  });

  it("keeps a new drag started synchronously during failed-save rollback", async () => {
    customWorld();
    const first = deferred(),
      second = deferred();
    const reorder = vi
      .spyOn(WorldCategoriesService, "reorderCategories")
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const original = categoryIds();
    const firstSave = store().reorderCategories([...original].reverse());
    const failed = expect(firstSave).rejects.toThrow("First failed");
    const latestIds = [original[1], original[0], ...original.slice(2)];
    let latestSave: Promise<void> | undefined;
    const unsubscribe = useWorldCategoriesStore.subscribe(() => {
      if (categoryIds().join() === original.join()) {
        unsubscribe();
        latestSave = store().reorderCategories(latestIds);
      }
    });
    await Promise.resolve();
    first.reject(new Error("First failed"));
    await failed;
    second.resolve();
    await latestSave;
    expect(reorder).toHaveBeenCalledTimes(2);
    expect(categoryIds()).toEqual(latestIds);
  });

  it("keeps a new drag started synchronously when a confirmation times out", async () => {
    vi.useFakeTimers();
    const fixture = customWorld();
    const second = deferred();
    const reorder = vi
      .spyOn(WorldCategoriesService, "reorderCategories")
      .mockResolvedValueOnce(undefined)
      .mockReturnValueOnce(second.promise);
    const original = categoryIds();
    await store().reorderCategories([...original].reverse());
    const latestIds = [original[1], original[0], ...original.slice(2)];
    let latestSave: Promise<void> | undefined;
    const unsubscribe = useWorldCategoriesStore.subscribe(() => {
      if (categoryIds().join() === original.join()) {
        unsubscribe();
        latestSave = store().reorderCategories(latestIds);
      }
    });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(reorder).toHaveBeenCalledTimes(2);
    fixture.categoriesChanged(fixture.defaults.categories, [], true);
    expect(categoryIds()).toEqual(latestIds);
    second.resolve();
    await latestSave;
    expect(categoryIds()).toEqual(latestIds);
  });

  it("preserves an inherited drag through resolved defaults and the customized subscription transition", async () => {
    const fixture = customWorld();
    await listenToDefaults();
    store().applyDefaultReplacementMap(world.id, {});
    const request = deferred();
    const reorder = vi
      .spyOn(WorldCategoriesService, "reorderCategories")
      .mockReturnValue(request.promise);
    const ids = categoryIds().reverse();
    const save = store().reorderCategories(ids);
    store().applyDefaultReplacementMap(world.id, {});
    expect(categoryIds()).toEqual(ids);
    fixture.listen(false);
    expect(categoryIds()).toEqual(ids);
    expect(store().loading).toBe(true);
    fixture.categoriesChanged(fixture.defaults.categories, [], true);
    fixture.fieldsChanged(fixture.defaults.fieldDefinitions, [], true);
    expect(categoryIds()).toEqual(ids);
    request.resolve();
    await save;
    expect(reorder).toHaveBeenCalledWith(world.id, ids, expect.any(Array));
    expect(categoryIds()).toEqual(ids);
  });

  it("ignores late completion and stale realtime callbacks after switching worlds", async () => {
    const fixture = customWorld();
    const request = deferred();
    vi.spyOn(WorldCategoriesService, "reorderCategories").mockReturnValue(
      request.promise,
    );
    const save = store().reorderCategories(categoryIds().reverse());
    await Promise.resolve();
    const next = { ...world, id: "3325bfc5-2c3d-41e2-8068-70b61d4bccdd" };
    store().listenToWorldCategories(next);
    await vi.waitFor(() => expect(store().configurationLoaded).toBe(true));
    const nextCategories = store().categories;
    fixture.categoriesChanged(fixture.defaults.categories, [], true);
    request.reject(new Error("Old world failed"));
    await expect(save).rejects.toThrow("Old world failed");
    expect(store().worldId).toBe(next.id);
    expect(store().categories).toEqual(nextCategories);
    expect(store().error).toBeUndefined();
  });

  it("releases a missing confirmation to server order and exposes an error instead of keeping a permanent overlay", async () => {
    vi.useFakeTimers();
    const fixture = customWorld();
    vi.spyOn(WorldCategoriesService, "reorderCategories").mockResolvedValue(
      undefined,
    );
    const original = categoryIds();
    await store().reorderCategories([...original].reverse());
    fixture.categoriesChanged(fixture.defaults.categories, [], true);
    expect(categoryIds()).toEqual([...original].reverse());
    await vi.advanceTimersByTimeAsync(10_000);
    expect(categoryIds()).toEqual(original);
    expect(store().error).toMatch(/could not be confirmed/);
  });

  it("does not reset the shared store when a non-subscribing panel unmounts", async () => {
    await listenToDefaults();
    const categories = store().categories;
    const hook = renderHook(() => useListenToWorldCategories(undefined));
    hook.unmount();
    expect(store().categories).toEqual(categories);
  });
});
