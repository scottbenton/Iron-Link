import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldOracleCatalog } from "lib/worldOracleCatalog";

import { WorldPermission } from "repositories/shared.types";

import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";
import {
  type IWorldOracleChange,
  WorldOracleChangesService,
} from "services/worldOracleChanges.service";

import { useWorldStore } from "../world.store";
import { useWorldCategoriesStore } from "../worldCategories.store";
import {
  getBannerChanges,
  getFlaggedChanges,
  useListenToWorldOracleChanges,
} from "../worldOracleChanges.store";
import { useWorldOraclesStore } from "../worldOracles.store";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const change = (
  id: string,
  seq: number,
  sourceGameId: string | null,
  fieldId = "field",
  ruleIndex: number | null = null,
): IWorldOracleChange => ({
  id,
  worldId: "world",
  fieldId,
  ruleIndex,
  previousOracleId: "oracle_rollable:base/names/given",
  nextOracleId: "oracle_rollable:exp/names/given",
  sourceGameId,
  seq,
  updatedAt: new Date(0),
});

describe("getBannerChanges", () => {
  const changes = {
    mine: change("mine", 1, "game"),
    other: change("other", 2, "other-game"),
    found: change("found", 3, null),
  };

  it("shows other games' changes and changes found on read", () => {
    expect(
      getBannerChanges(
        {
          changes,
          gameId: "game",
          dismissedSeq: null,
          dismissalLoading: false,
        },
        "game",
      ).map((c) => c.id),
    ).toEqual(["other", "found"]);
  });

  it("hides changes up to the game's dismissal", () => {
    expect(
      getBannerChanges(
        { changes, gameId: "game", dismissedSeq: 2, dismissalLoading: false },
        "game",
      ).map((c) => c.id),
    ).toEqual(["found"]);
  });

  it("shows nothing while the dismissal loads", () => {
    expect(
      getBannerChanges(
        { changes, gameId: "game", dismissedSeq: null, dismissalLoading: true },
        "game",
      ),
    ).toEqual([]);
  });
});

describe("getFlaggedChanges", () => {
  it("groups by field, leaving out the current game's own choices", () => {
    const changes = {
      a: change("a", 2, null, "field", 0),
      b: change("b", 1, "other", "field"),
      c: change("c", 3, "game", "other-field"),
    };
    expect(
      Object.fromEntries(
        Object.entries(getFlaggedChanges(changes, "game")).map(([id, list]) => [
          id,
          list.map((c) => c.id),
        ]),
      ),
    ).toEqual({ field: ["b", "a"] });
    expect(Object.keys(getFlaggedChanges(changes, undefined))).toEqual([
      "field",
      "other-field",
    ]);
  });
});

// Detection on read: a Guide's client records saved targets that moved
// without anyone choosing.
describe("recording changes found on read", () => {
  const GIVEN = "oracle_rollable:base/names/given";
  const EXP_GIVEN = "oracle_rollable:exp/names/given";
  const linkedGames = [
    {
      rulesets: { base: true },
      expansions: { base: { exp: true } },
      playset: {},
    },
  ];
  const field = (resolvedOracleId: string): IWorldFieldDefinition =>
    ({
      id: "field",
      binding: {
        packageId: "base",
        oracleId: GIVEN,
        resolvedOracleId,
      },
      configuration: {
        version: 1,
        suggestions: [],
        helpText: "",
        visible: true,
        rules: [],
      },
    }) as unknown as IWorldFieldDefinition;
  const catalog = {
    replacementMap: { [GIVEN]: EXP_GIVEN },
    missingPackageIds: [],
  } as unknown as WorldOracleCatalog;

  let record: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    record = vi.fn(() => Promise.resolve(1));
    vi.spyOn(WorldOracleChangesService, "recordChanges").mockImplementation(
      record,
    );
    vi.spyOn(
      WorldOracleChangesService,
      "listenToWorldOracleChanges",
    ).mockReturnValue(() => {});
    useWorldStore.setState({
      worldId: "world",
      worldPermission: WorldPermission.Guide,
    });
    useWorldOraclesStore.setState({
      worldId: "world",
      loading: false,
      catalog,
      linkedGames,
      bindingPackageIds: ["base"],
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    useWorldStore.setState({ worldId: "", worldPermission: null });
    useWorldOraclesStore.getState().reset();
    useWorldCategoriesStore.getState().reset();
  });

  const loadFields = (fields: IWorldFieldDefinition[], customized = true) =>
    useWorldCategoriesStore.setState({
      worldId: "world",
      loading: false,
      error: undefined,
      configurationCustomized: customized,
      storedFieldDefinitions: Object.fromEntries(fields.map((f) => [f.id, f])),
    });

  it("records a moved target once, with the playsets it came from", () => {
    loadFields([field(GIVEN)]);
    const hook = renderHook(() => useListenToWorldOracleChanges("world"));
    expect(record).toHaveBeenCalledOnce();
    expect(record).toHaveBeenCalledWith(
      "world",
      [
        {
          worldId: "world",
          fieldId: "field",
          ruleIndex: null,
          previousOracleId: GIVEN,
          nextOracleId: EXP_GIVEN,
        },
      ],
      linkedGames,
    );
    act(() => loadFields([field(GIVEN)]));
    expect(record).toHaveBeenCalledOnce();
    hook.unmount();
  });

  it("records nothing when every target already matches", () => {
    loadFields([field(EXP_GIVEN)]);
    const hook = renderHook(() => useListenToWorldOracleChanges("world"));
    expect(record).not.toHaveBeenCalled();
    hook.unmount();
  });

  it("waits for a catalog built from the bindings in hand", () => {
    useWorldOraclesStore.setState({ bindingPackageIds: ["other"] });
    loadFields([field(GIVEN)]);
    const hook = renderHook(() => useListenToWorldOracleChanges("world"));
    expect(record).not.toHaveBeenCalled();
    hook.unmount();
  });

  it("leaves it to world editors and Guides", () => {
    useWorldStore.setState({ worldPermission: WorldPermission.Player });
    loadFields([field(GIVEN)]);
    const hook = renderHook(() => useListenToWorldOracleChanges("world"));
    expect(record).not.toHaveBeenCalled();
    hook.unmount();
  });
});
