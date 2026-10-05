import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type WorldOracleCatalog,
  getBindingPackageIds,
  loadWorldOracleCatalog,
} from "lib/worldOracleCatalog";

import { WorldPlaysetsRepository } from "repositories/worldPlaysets.repository";

import { WorldCategoriesService } from "services/worldCategories.service";
import {
  WorldConfigurationReadService,
  type WorldConfigurationSnapshot,
} from "services/worldConfigurationRead.service";
import { WorldFieldDefinitionsService } from "services/worldFieldDefinitions.service";
import type { IWorld } from "services/worlds.service";

import { useWorldCategoriesStore } from "../worldCategories.store";
import { useWorldResourcesStore } from "../worldResources.store";
import { createStoreConfigurationFixture } from "./worldConfiguration.fixture";

vi.mock("lib/supabase.lib", () => ({ supabase: { rpc: vi.fn() } }));
vi.mock("lib/worldOracleCatalog", async (original) => ({
  ...(await original<typeof import("lib/worldOracleCatalog")>()),
  loadWorldOracleCatalog: vi.fn(),
}));
const firstId = "09c0d230-3f90-4acb-a407-c8b99e074a2c";
const secondId = "3325bfc5-2c3d-41e2-8068-70b61d4bccdd";
const world = (id = firstId): IWorld => ({
  id,
  name: "Our world",
  description: null,
  settingKey: "world:starforged/forge",
  configurationCustomized: false,
  createdBy: "owner",
  createdAt: new Date(0),
  updatedAt: new Date(0),
});
const snapshot = (id = firstId): WorldConfigurationSnapshot => ({
  ...createStoreConfigurationFixture(id),
  configurationCustomized: false,
});
const catalog = (
  replacementMap: Record<string, string> = {},
): WorldOracleCatalog => ({
  tree: {},
  effectivePlayset: { packageIds: [], isOracleIncluded: () => true },
  choices: [],
  replacementMap,
  collisions: {},
  missingPackageIds: [],
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const resources = () => useWorldResourcesStore.getState();
const categories = () => useWorldCategoriesStore.getState();
let stop: () => void;
let categoryUpdates: Parameters<
  typeof WorldCategoriesService.listenToWorldCategories
>[1];
let fieldUpdates: Parameters<
  typeof WorldFieldDefinitionsService.listenToWorldFieldDefinitions
>[1];
let stopCategories: ReturnType<typeof vi.fn>;
let stopFields: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(loadWorldOracleCatalog).mockReset().mockResolvedValue(catalog());
  vi.spyOn(
    WorldConfigurationReadService,
    "getWorldConfiguration",
  ).mockImplementation(async (id) => snapshot(id));
  vi.spyOn(WorldPlaysetsRepository, "getLinkedGamePlaysets").mockResolvedValue(
    [],
  );
  stopCategories = vi.fn();
  stopFields = vi.fn();
  vi.spyOn(
    WorldCategoriesService,
    "listenToWorldCategories",
  ).mockImplementation((_id, callback) => {
    categoryUpdates = callback;
    return stopCategories;
  });
  vi.spyOn(
    WorldFieldDefinitionsService,
    "listenToWorldFieldDefinitions",
  ).mockImplementation((_id, callback) => {
    fieldUpdates = callback;
    return stopFields;
  });
});
afterEach(() => stop?.());
function observe(id = firstId) {
  const session = resources().observeWorld(id);
  stop = session.stop;
  return session;
}
async function ready() {
  await vi.waitFor(() => expect(resources().loading).toBe(false));
}
const goal = () =>
  Object.values(categories().fieldDefinitions).find(
    (field) => field.key === "goal",
  )!;

describe("world resources subscription", () => {
  it("loads configuration and playsets once on initial delivery and again for an identical reconnect row", async () => {
    const session = observe();
    expect(
      WorldConfigurationReadService.getWorldConfiguration,
    ).not.toHaveBeenCalled();
    const row = world();
    session.receiveWorld(row);
    await ready();
    expect(categories().configurationLoaded).toBe(true);
    expect(categories().defaultBindingsReady).toBe(true);
    expect(
      getBindingPackageIds(
        vi.mocked(loadWorldOracleCatalog).mock.calls[0][0].bindings!,
      ),
    ).toEqual(["starforged"]);
    session.receiveWorld(row);
    expect(categories().defaultBindingsReady).toBe(false);
    await ready();
    expect(
      WorldConfigurationReadService.getWorldConfiguration,
    ).toHaveBeenCalledTimes(2);
    expect(WorldPlaysetsRepository.getLinkedGamePlaysets).toHaveBeenCalledTimes(
      2,
    );
  });

  it("refreshes inherited fields on the world's realtime template-change delivery", async () => {
    const session = observe();
    session.receiveWorld(world());
    await ready();
    const changed = snapshot();
    Object.values(changed.categories)[0].name = "Updated Places";
    Object.values(changed.fieldDefinitions)[0].label = "Updated Kind";
    vi.mocked(
      WorldConfigurationReadService.getWorldConfiguration,
    ).mockResolvedValue(changed);
    session.receiveWorld({ ...world(), updatedAt: new Date(1) });
    await ready();
    expect(Object.values(categories().categories)[0].name).toBe(
      "Updated Places",
    );
    expect(Object.values(categories().fieldDefinitions)[0].label).toBe(
      "Updated Kind",
    );
  });

  it.each(["success", "failure"])(
    "ignores a late same-world request %s after a newer refresh",
    async (outcome) => {
      const old = deferred<WorldConfigurationSnapshot>();
      vi.mocked(
        WorldConfigurationReadService.getWorldConfiguration,
      ).mockReturnValueOnce(old.promise);
      const session = observe();
      session.receiveWorld(world());
      session.receiveWorld(world());
      await ready();
      const accepted = categories().categories;
      if (outcome === "success") {
        const stale = snapshot();
        Object.values(stale.categories)[0].name = "Stale";
        old.resolve(stale);
      } else old.reject(new Error("Stale failure"));
      await Promise.resolve();
      await Promise.resolve();
      expect(categories().categories).toEqual(accepted);
      expect(resources().error).toBeUndefined();
    },
  );

  it.each(["success", "failure"])(
    "ignores an inherited request %s after first-edit handover",
    async (outcome) => {
      const pending = deferred<WorldConfigurationSnapshot>();
      vi.mocked(
        WorldConfigurationReadService.getWorldConfiguration,
      ).mockReturnValueOnce(pending.promise);
      const session = observe();
      session.receiveWorld(world());
      session.receiveWorld({ ...world(), configurationCustomized: true });
      categoryUpdates({}, [], true);
      fieldUpdates({}, [], true);
      await ready();
      if (outcome === "success")
        pending.resolve({ ...snapshot(), configurationCustomized: true });
      else pending.reject(new Error("Old inherited read failed"));
      await Promise.resolve();
      await Promise.resolve();
      expect(categories().configurationCustomized).toBe(true);
      expect(categories().categories).toEqual({});
      expect(categories().fieldDefinitions).toEqual({});
      expect(resources().error).toBeUndefined();
      expect(
        WorldCategoriesService.listenToWorldCategories,
      ).toHaveBeenCalledOnce();
    },
  );

  it("ignores an old world's configuration snapshot after a world switch", async () => {
    const pending = deferred<WorldConfigurationSnapshot>();
    vi.mocked(
      WorldConfigurationReadService.getWorldConfiguration,
    ).mockReturnValueOnce(pending.promise);
    const previous = observe();
    previous.receiveWorld(world());
    const next = observe(secondId);
    next.receiveWorld(world(secondId));
    await ready();
    const accepted = categories().categories;
    pending.resolve(snapshot());
    await Promise.resolve();
    await Promise.resolve();
    expect(categories().worldId).toBe(secondId);
    expect(categories().categories).toEqual(accepted);
  });

  it.each(["success", "failure"])(
    "ignores old-world catalog %s and obsolete-owner cleanup",
    async (outcome) => {
      const old = deferred<WorldOracleCatalog>();
      vi.mocked(loadWorldOracleCatalog).mockReturnValueOnce(old.promise);
      const previous = observe();
      previous.receiveWorld(world());
      await vi.waitFor(() =>
        expect(loadWorldOracleCatalog).toHaveBeenCalledOnce(),
      );
      const next = observe(secondId);
      next.receiveWorld(world(secondId));
      await ready();
      previous.stop();
      previous.receiveWorld(world());
      if (outcome === "success") old.resolve(catalog({ stale: "target" }));
      else old.reject(new Error("Stale failure"));
      await Promise.resolve();
      await Promise.resolve();
      expect(resources().worldId).toBe(secondId);
      expect(resources().catalog?.replacementMap).toEqual({});
      expect(resources().error).toBeUndefined();
      expect(categories().worldId).toBe(secondId);
    },
  );

  it("blocks first edit during refresh and after failure; retry restores readiness", async () => {
    const session = observe();
    session.receiveWorld(world());
    await ready();
    const pending = deferred<WorldConfigurationSnapshot>();
    vi.mocked(
      WorldConfigurationReadService.getWorldConfiguration,
    ).mockReturnValueOnce(pending.promise);
    session.receiveWorld(world());
    const categoryId = Object.keys(categories().categories)[0];
    expect(() => categories().deleteCategory(categoryId)).toThrow(
      /finish loading/,
    );
    pending.reject(new Error("Configuration unavailable"));
    await ready();
    expect(categories().defaultBindingsReady).toBe(false);
    expect(() =>
      categories().updateCategory(categoryId, { name: "New" }),
    ).toThrow(/finish loading/);
    expect(resources().error).toBe("Configuration unavailable");
    const catalogLoads = vi.mocked(loadWorldOracleCatalog).mock.calls.length;
    resources().setAllPackages(firstId, true);
    await Promise.resolve();
    expect(loadWorldOracleCatalog).toHaveBeenCalledTimes(catalogLoads);
    expect(categories().defaultBindingsReady).toBe(false);
    expect(() => categories().deleteCategory(categoryId)).toThrow(
      /finish loading/,
    );
    resources().refresh(firstId);
    await ready();
    expect(categories().defaultBindingsReady).toBe(true);
    expect(categories().error).toBeUndefined();
  });

  it("reports one initial catalog failure and waits for explicit authoritative retry", async () => {
    vi.mocked(loadWorldOracleCatalog).mockRejectedValueOnce(
      new Error("Package unavailable"),
    );
    const session = observe();
    session.receiveWorld(world());
    await ready();
    expect(loadWorldOracleCatalog).toHaveBeenCalledOnce();
    expect(resources().error).toBe("Package unavailable");
    expect(categories().defaultBindingsReady).toBe(false);
    expect(() =>
      categories().deleteCategory(Object.keys(categories().categories)[0]),
    ).toThrow(/finish loading/);
    categories().setConfigurationError(
      firstId,
      "Another category notification",
    );
    resources().setAllPackages(firstId, true);
    await Promise.resolve();
    await Promise.resolve();
    expect(loadWorldOracleCatalog).toHaveBeenCalledOnce();
    expect(resources().loading).toBe(false);
    expect(resources().error).toBe("Package unavailable");
    expect(categories().defaultBindingsReady).toBe(false);
    resources().refresh(firstId);
    await ready();
    expect(loadWorldOracleCatalog).toHaveBeenCalledTimes(2);
    expect(
      WorldConfigurationReadService.getWorldConfiguration,
    ).toHaveBeenCalledTimes(2);
    expect(WorldPlaysetsRepository.getLinkedGamePlaysets).toHaveBeenCalledTimes(
      2,
    );
    expect(resources().error).toBeUndefined();
    expect(categories().defaultBindingsReady).toBe(true);
  });

  it("keeps unresolved defaults stable, preserves exact bindings and explicit null fallback", async () => {
    const source = "oracle_rollable:starforged/character/goal";
    const target = "oracle_rollable:starsmith/character/goal";
    const defaults = snapshot();
    const field = Object.values(defaults.fieldDefinitions).find(
      (item) => item.key === "goal",
    )!;
    field.configuration.rules = [
      { conditions: [], binding: null },
      { conditions: [], binding: { ...field.binding!, exact: true } },
    ];
    vi.mocked(
      WorldConfigurationReadService.getWorldConfiguration,
    ).mockResolvedValue(defaults);
    vi.mocked(loadWorldOracleCatalog).mockResolvedValue(
      catalog({ [source]: target }),
    );
    const session = observe();
    session.receiveWorld(world());
    await ready();
    expect(goal().binding?.oracleId).toBe(target);
    expect(goal().configuration.rules[0].binding).toBeNull();
    expect(goal().configuration.rules[1].binding?.oracleId).toBe(source);
    expect(
      categories().sourceFieldDefinitions[field.id].binding?.oracleId,
    ).toBe(source);
    expect(
      WorldPlaysetsRepository.getLinkedGamePlaysets,
    ).toHaveBeenCalledOnce();
    expect(loadWorldOracleCatalog).toHaveBeenCalledOnce();
  });

  it("honors snapshot customization before the world row and retains subscriptions across refreshes", async () => {
    const custom = { ...snapshot(), configurationCustomized: true };
    vi.mocked(
      WorldConfigurationReadService.getWorldConfiguration,
    ).mockResolvedValueOnce(custom);
    const session = observe();
    session.receiveWorld(world());
    await ready();
    expect(categories().configurationCustomized).toBe(true);
    categoryUpdates(custom.categories, [], true);
    fieldUpdates(custom.fieldDefinitions, [], true);
    await ready();
    const originalFields = categories().fieldDefinitions;
    session.receiveWorld(world());
    await ready();
    expect(categories().configurationCustomized).toBe(true);
    expect(categories().fieldDefinitions).toEqual(originalFields);
    expect(
      WorldCategoriesService.listenToWorldCategories,
    ).toHaveBeenCalledOnce();
    expect(
      WorldFieldDefinitionsService.listenToWorldFieldDefinitions,
    ).toHaveBeenCalledOnce();
    expect(stopCategories).not.toHaveBeenCalled();
    expect(stopFields).not.toHaveBeenCalled();
  });

  it("rebuilds from cached playsets on package changes and allPackages, but ignores label and order edits", async () => {
    const session = observe();
    session.receiveWorld({ ...world(), configurationCustomized: true });
    const custom = snapshot();
    categoryUpdates(custom.categories, [], true);
    fieldUpdates(custom.fieldDefinitions, [], true);
    await ready();
    const field = goal();
    fieldUpdates(
      { [field.id]: { ...field, label: "New label", sortOrder: 50 } },
      [],
      false,
    );
    expect(loadWorldOracleCatalog).toHaveBeenCalledOnce();
    resources().setAllPackages(firstId, true);
    await ready();
    expect(loadWorldOracleCatalog).toHaveBeenLastCalledWith(
      expect.objectContaining({ allPackages: true }),
    );
    fieldUpdates(
      {
        [field.id]: {
          ...field,
          binding: {
            packageId: "homebrew",
            oracleId: "oracle_rollable:homebrew/goal",
            resolvedOracleId: "oracle_rollable:homebrew/goal",
          },
        },
      },
      [],
      false,
    );
    await ready();
    expect(loadWorldOracleCatalog).toHaveBeenCalledTimes(3);
    expect(
      WorldPlaysetsRepository.getLinkedGamePlaysets,
    ).toHaveBeenCalledOnce();
    expect(
      WorldConfigurationReadService.getWorldConfiguration,
    ).toHaveBeenCalledOnce();
    expect(goal().binding?.packageId).toBe("homebrew");
  });

  it("uses current package inputs when custom realtime changes arrive during catalog loading", async () => {
    const pending = deferred<WorldOracleCatalog>();
    vi.mocked(loadWorldOracleCatalog).mockReturnValueOnce(pending.promise);
    const session = observe();
    session.receiveWorld({ ...world(), configurationCustomized: true });
    const custom = snapshot();
    categoryUpdates(custom.categories, [], true);
    fieldUpdates(custom.fieldDefinitions, [], true);
    await vi.waitFor(() =>
      expect(loadWorldOracleCatalog).toHaveBeenCalledOnce(),
    );
    const field = goal();
    fieldUpdates(
      {
        [field.id]: {
          ...field,
          binding: {
            packageId: "homebrew",
            oracleId: "oracle_rollable:homebrew/goal",
            resolvedOracleId: "oracle_rollable:homebrew/goal",
          },
        },
      },
      [],
      false,
    );
    resources().setAllPackages(firstId, true);
    pending.resolve(catalog());
    await ready();
    expect(loadWorldOracleCatalog).toHaveBeenCalledTimes(2);
    expect(loadWorldOracleCatalog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        allPackages: true,
        bindings: [expect.objectContaining({ packageId: "homebrew" })],
      }),
    );
    expect(
      WorldPlaysetsRepository.getLinkedGamePlaysets,
    ).toHaveBeenCalledOnce();
  });
});
