import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createWorldFieldConfiguration } from "lib/worldFieldRules";

import { WorldCategoriesService } from "services/worldCategories.service";
import {
  IWorldConfiguration,
  WorldConfigurationService,
} from "services/worldConfiguration.service";
import {
  IWorldFieldDefinition,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { useWorldCategoriesStore } from "../worldCategories.store";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const worldId = "world-1";
const goalId = "oracle_rollable:starforged/character/goal";
const replacementId = "oracle_rollable:starsmith/character/goal";

const goal: IWorldFieldDefinition = {
  id: "field-goal",
  worldId,
  categoryId: "category-npcs",
  key: "goal",
  label: "Goal",
  type: WorldFieldType.OracleText,
  binding: {
    packageId: "starforged",
    oracleId: goalId,
    resolvedOracleId: goalId,
  },
  configuration: createWorldFieldConfiguration(),
  gmOnly: false,
  sortOrder: 0,
};

function configuration(customized: boolean): IWorldConfiguration {
  return {
    configurationCustomized: customized,
    categories: {
      "category-npcs": {
        id: "category-npcs",
        worldId,
        name: "NPCs",
        icon: null,
        sortOrder: 0,
        supportsHierarchy: false,
        supportsMap: false,
        supportsBonds: true,
        subtitleFieldDefinitionId: null,
      },
    },
    fieldDefinitions: { [goal.id]: goal },
  };
}

const store = () => useWorldCategoriesStore.getState();
let deliver: (configuration: IWorldConfiguration) => void;
const refresh = vi.fn(() => Promise.resolve());

beforeEach(() => {
  vi.spyOn(
    WorldConfigurationService,
    "listenToWorldConfiguration",
  ).mockImplementation((_worldId, onConfiguration) => {
    deliver = onConfiguration;
    return { refresh, unsubscribe: vi.fn() };
  });
  vi.spyOn(WorldCategoriesService, "updateWorldCategory").mockResolvedValue();
});

afterEach(() => {
  store().reset();
  vi.restoreAllMocks();
  refresh.mockClear();
});

describe("world configuration store", () => {
  it("resolves inherited bindings to the current playset without changing the picked oracle", () => {
    store().listenToWorldConfiguration(worldId);
    deliver(configuration(false));
    expect(store().defaultBindingsReady).toBe(false);

    store().applyReplacementMap(worldId, { [goalId]: replacementId });

    expect(store().defaultBindingsReady).toBe(true);
    expect(store().fieldDefinitions[goal.id].binding).toEqual({
      packageId: "starforged",
      oracleId: goalId,
      resolvedOracleId: replacementId,
    });
    expect(
      store().storedFieldDefinitions[goal.id].binding?.resolvedOracleId,
    ).toBe(goalId);
  });

  it("keeps customized bindings at their stored targets", () => {
    store().listenToWorldConfiguration(worldId);
    store().applyReplacementMap(worldId, { [goalId]: replacementId });
    deliver(configuration(true));

    expect(store().fieldDefinitions[goal.id].binding?.resolvedOracleId).toBe(
      goalId,
    );
  });

  it("pins resolved inherited bindings with the first edit and waits for a fresh read", async () => {
    store().listenToWorldConfiguration(worldId);
    deliver(configuration(false));
    store().applyReplacementMap(worldId, { [goalId]: replacementId });

    await store().updateCategory("category-npcs", { name: "People" });

    expect(WorldCategoriesService.updateWorldCategory).toHaveBeenCalledWith(
      worldId,
      "category-npcs",
      { name: "People" },
      [
        {
          ...goal,
          binding: {
            packageId: "starforged",
            oracleId: goalId,
            resolvedOracleId: replacementId,
          },
        },
      ],
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("refuses to fork inherited defaults before the world's oracles load", async () => {
    store().listenToWorldConfiguration(worldId);
    deliver(configuration(false));

    await expect(
      store().updateCategory("category-npcs", { name: "People" }),
    ).rejects.toThrow("oracles");
    expect(WorldCategoriesService.updateWorldCategory).not.toHaveBeenCalled();
  });

  it("edits customized worlds without sending default bindings", async () => {
    store().listenToWorldConfiguration(worldId);
    deliver(configuration(true));

    await store().updateCategory("category-npcs", { name: "People" });

    expect(WorldCategoriesService.updateWorldCategory).toHaveBeenCalledWith(
      worldId,
      "category-npcs",
      { name: "People" },
      undefined,
    );
  });
});
