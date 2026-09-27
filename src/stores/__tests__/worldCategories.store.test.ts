import { beforeEach, describe, expect, it, vi } from "vitest";

import { getWorldDefaultConfiguration } from "lib/worldDefaultConfiguration";

import { WorldCategoriesService } from "services/worldCategories.service";
import { WorldFieldDefinitionsService } from "services/worldFieldDefinitions.service";

import { useWorldCategoriesStore } from "../worldCategories.store";

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
});

describe("world configuration source", () => {
  it("reads defaults without subscribing or writing, including for readers", () => {
    const categories = vi.spyOn(
      WorldCategoriesService,
      "listenToWorldCategories",
    );
    const fields = vi.spyOn(
      WorldFieldDefinitionsService,
      "listenToWorldFieldDefinitions",
    );
    const stop = store().listenToWorldCategories(world);
    expect(
      Object.values(store().categories).map((category) => category.name),
    ).toEqual(["Locations", "NPCs", "Lore", "Factions"]);
    expect(store().loading).toBe(false);
    expect(store().configurationCustomized).toBe(false);
    expect(categories).not.toHaveBeenCalled();
    expect(fields).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
    stop();
  });

  it("resolves defaults afresh without changing identities or mutating shared definitions", () => {
    store().listenToWorldCategories(world);
    const original = getWorldDefaultConfiguration(world.id, world.settingKey);
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
    expect(getWorldDefaultConfiguration(world.id, world.settingKey)).toEqual(
      original,
    );
    store().applyDefaultReplacementMap(world.id, {});
    expect(store().fieldDefinitions[goal.id].binding?.resolvedOracleId).toBe(
      source,
    );
  });

  it("keeps read-only counts separate and sends first edit plus resolved binding snapshot atomically", async () => {
    store().listenToWorldCategories(world);
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

  it("routes a first reorder through the same atomic fork, and blocks edits with stale binding resolution", async () => {
    store().listenToWorldCategories(world);
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

  it("waits for both custom snapshots and never resurrects deleted defaults", () => {
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
    store().listenToWorldCategories({
      ...world,
      id: "3325bfc5-2c3d-41e2-8068-70b61d4bccdd",
    });
    categoriesChanged!({}, [], true);
    fieldsChanged!({}, [], true);
    expect(Object.keys(store().categories)).toHaveLength(
      Object.keys(
        getWorldDefaultConfiguration(world.id, world.settingKey).categories,
      ).length,
    );
    expect(stopCategories).toHaveBeenCalledOnce();
    expect(stopFields).toHaveBeenCalledOnce();
  });
});
