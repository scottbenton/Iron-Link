import { act, render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldOracleCatalog } from "lib/worldOracleCatalog";

import type {
  IWorldFieldDefinition,
  OracleBinding,
} from "services/worldFieldDefinitions.service";
import type { IWorld } from "services/worlds.service";

import { WorldOracleContextProvider } from "../WorldOracleContextProvider";
import { field } from "../categories/__tests__/fixtures";
import { WorldOracleContext } from "../worldOracleContext";

const state = vi.hoisted(() => ({
  world: undefined as IWorld | undefined,
  worldId: "world-a",
  configurationLoaded: false,
  configurationCustomized: false,
  sourceFieldDefinitions: {} as Record<string, IWorldFieldDefinition>,
  fieldDefinitions: {} as Record<string, IWorldFieldDefinition>,
  applyDefaultReplacementMap: vi.fn(),
  invalidateDefaultBindings: vi.fn(),
  getLinkedGamePlaysets: vi.fn(),
  loadWorldOracleCatalog: vi.fn(),
}));

vi.mock("stores/world.store", () => ({
  useWorldStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock("stores/worldCategories.store", () => ({
  useWorldCategoriesStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock("repositories/worldPlaysets.repository", () => ({
  WorldPlaysetsRepository: {
    getLinkedGamePlaysets: state.getLinkedGamePlaysets,
  },
}));
vi.mock("lib/worldOracleCatalog", () => ({
  loadWorldOracleCatalog: state.loadWorldOracleCatalog,
}));

const binding: OracleBinding = {
  packageId: "ironsworn",
  oracleId: "oracle_rollable:ironsworn/character/name/ironlander",
  resolvedOracleId: "oracle_rollable:ironsworn/character/name/ironlander",
  exact: false,
};
const replacementId = "oracle_rollable:homebrew/character/name/ironlander";

function catalog(
  replacementMap: Record<string, string> = {},
): WorldOracleCatalog {
  return {
    tree: {},
    effectivePlayset: { packageIds: [], isOracleIncluded: () => true },
    choices: [],
    replacementMap,
    collisions: {},
    missingPackageIds: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function OracleStatus() {
  const context = useContext(WorldOracleContext);
  return (
    <output aria-label="Oracle status">
      {context?.worldId}:{context?.loading ? "loading" : "ready"}:
      {context?.catalog?.replacementMap[binding.oracleId] ?? "none"}
    </output>
  );
}

const provider = (worldId = "world-a") => (
  <WorldOracleContextProvider worldId={worldId}>
    <OracleStatus />
  </WorldOracleContextProvider>
);

beforeEach(() => {
  vi.resetAllMocks();
  state.worldId = "world-a";
  state.world = {
    id: "world-a",
    name: "Our world",
    description: null,
    settingKey: "world:ironsworn/ironlands",
    configurationCustomized: false,
    createdBy: "owner",
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
  state.configurationLoaded = false;
  state.configurationCustomized = false;
  state.sourceFieldDefinitions = {
    description: field({ worldId: "world-a", binding }),
  };
  state.fieldDefinitions = {};
  state.getLinkedGamePlaysets.mockResolvedValue([]);
  state.loadWorldOracleCatalog.mockResolvedValue(catalog());
});

describe("WorldOracleContextProvider database configuration", () => {
  it("waits for the matching database snapshot before loading its base and conditional bindings", async () => {
    const ruleBinding = {
      ...binding,
      oracleId: "oracle_rollable:ironsworn/core/action",
      resolvedOracleId: "oracle_rollable:ironsworn/core/action",
    };
    state.sourceFieldDefinitions.description.configuration.rules = [
      {
        conditions: [
          {
            source: "entry",
            fieldId: "type",
            operator: "equals",
            value: "Person",
          },
        ],
        binding: ruleBinding,
      },
    ];
    const view = render(provider());
    await act(async () => undefined);
    expect(state.getLinkedGamePlaysets).not.toHaveBeenCalled();
    expect(state.loadWorldOracleCatalog).not.toHaveBeenCalled();

    state.configurationLoaded = true;
    state.worldId = "world-b";
    view.rerender(provider());
    await act(async () => undefined);
    expect(state.getLinkedGamePlaysets).not.toHaveBeenCalled();

    state.worldId = "world-a";
    view.rerender(provider());
    await waitFor(() =>
      expect(state.loadWorldOracleCatalog).toHaveBeenCalledOnce(),
    );
    expect(state.loadWorldOracleCatalog).toHaveBeenCalledWith({
      linkedGames: [],
      settingKey: "world:ironsworn/ironlands",
      bindings: expect.arrayContaining([binding, ruleBinding]),
      allPackages: false,
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Oracle status")).toHaveTextContent(
        "world-a:ready:none",
      ),
    );
  });

  it("keeps inherited source bindings stable after applying displayed replacements", async () => {
    state.configurationLoaded = true;
    state.loadWorldOracleCatalog.mockResolvedValue(
      catalog({ [binding.oracleId]: replacementId }),
    );
    state.applyDefaultReplacementMap.mockImplementation(() => {
      state.fieldDefinitions = {
        description: field({
          worldId: "world-a",
          binding: {
            packageId: "homebrew",
            oracleId: replacementId,
            resolvedOracleId: replacementId,
          },
        }),
      };
    });
    const view = render(provider());
    await waitFor(() =>
      expect(state.applyDefaultReplacementMap).toHaveBeenCalledWith("world-a", {
        [binding.oracleId]: replacementId,
      }),
    );
    view.rerender(provider());
    await act(async () => undefined);
    expect(state.loadWorldOracleCatalog).toHaveBeenCalledOnce();
    expect(state.getLinkedGamePlaysets).toHaveBeenCalledOnce();
    expect(state.sourceFieldDefinitions.description.binding).toEqual(binding);
    expect(state.fieldDefinitions.description.binding?.oracleId).toBe(
      replacementId,
    );
    expect(screen.getByLabelText("Oracle status")).toHaveTextContent(
      `world-a:ready:${replacementId}`,
    );
  });

  it("uses the configuration snapshot's customization flag before the world row catches up", async () => {
    state.configurationLoaded = true;
    state.configurationCustomized = true;
    const customBinding = {
      ...binding,
      oracleId: replacementId,
      resolvedOracleId: replacementId,
      packageId: "homebrew",
    };
    state.fieldDefinitions = {
      description: field({ worldId: "world-a", binding: customBinding }),
    };
    render(provider());
    await waitFor(() =>
      expect(state.loadWorldOracleCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ bindings: [customBinding] }),
      ),
    );
  });

  it("discards a previous world's catalog response after switching worlds", async () => {
    state.configurationLoaded = true;
    const oldRequest = deferred<WorldOracleCatalog>();
    const newRequest = deferred<WorldOracleCatalog>();
    state.loadWorldOracleCatalog
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    const view = render(provider());
    await waitFor(() =>
      expect(state.loadWorldOracleCatalog).toHaveBeenCalledOnce(),
    );
    state.worldId = "world-b";
    state.world = { ...state.world!, id: "world-b" };
    state.sourceFieldDefinitions = {
      description: field({ worldId: "world-b", binding }),
    };
    view.rerender(provider("world-b"));
    await waitFor(() =>
      expect(state.loadWorldOracleCatalog).toHaveBeenCalledTimes(2),
    );
    await act(async () =>
      newRequest.resolve(catalog({ [binding.oracleId]: "new-world-oracle" })),
    );
    expect(screen.getByLabelText("Oracle status")).toHaveTextContent(
      "world-b:ready:new-world-oracle",
    );
    state.applyDefaultReplacementMap.mockClear();
    await act(async () =>
      oldRequest.resolve(catalog({ [binding.oracleId]: "old-world-oracle" })),
    );
    expect(screen.getByLabelText("Oracle status")).toHaveTextContent(
      "world-b:ready:new-world-oracle",
    );
    expect(state.applyDefaultReplacementMap).not.toHaveBeenCalled();
  });
});
