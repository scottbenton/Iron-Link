import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Difficulty } from "repositories/tracks.repository";

import {
  IWorldEntryBond,
  IWorldEntryBondKey,
  IWorldEntryConnection,
  WorldEntryBondsService,
} from "services/worldEntryBonds.service";

import { useWorldEntryBondsStore } from "../worldEntryBonds.store";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

type OnBonds = (
  changed: IWorldEntryBond[],
  removed: IWorldEntryBondKey[],
  replace: boolean,
) => void;

const store = () => useWorldEntryBondsStore.getState();

const bond = (
  entryId: string,
  characterId: string,
  extra: Partial<IWorldEntryBond> = {},
): IWorldEntryBond => ({
  entryId,
  characterId,
  worldId: "world",
  ...extra,
});

const connection = (
  id: string,
  extra: Partial<IWorldEntryConnection> = {},
): IWorldEntryConnection => ({
  id,
  entryId: "captain",
  gameId: "game",
  characterId: "kira",
  worldId: "world",
  rank: Difficulty.Dangerous,
  ticks: 0,
  bonded: false,
  ...extra,
});

let onEntry: Record<string, OnBonds>;
let onCharacter: Record<string, OnBonds>;
let stopped: string[];

beforeEach(() => {
  onEntry = {};
  onCharacter = {};
  stopped = [];
  vi.spyOn(WorldEntryBondsService, "listenToEntryBonds").mockImplementation(
    (id, callback) => {
      onEntry[id] = callback;
      return () => stopped.push(`entry:${id}`);
    },
  );
  vi.spyOn(WorldEntryBondsService, "listenToCharacterBonds").mockImplementation(
    (id, callback) => {
      onCharacter[id] = callback;
      return () => stopped.push(`character:${id}`);
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  useWorldEntryBondsStore.setState({
    bonds: {},
    connections: {},
    loading: {},
    errors: {},
  });
});

describe("world entry bonds store", () => {
  it("shares one record between the entry and character views", () => {
    const stopEntry = store().listenToEntryBonds("captain");
    const stopCharacter = store().listenToCharacterBonds("kira");
    expect(store().loading["entry:captain"]).toBe(true);

    onEntry.captain(
      [bond("captain", "kira"), bond("captain", "vex")],
      [],
      true,
    );
    onCharacter.kira(
      [bond("captain", "kira"), bond("harbour", "kira")],
      [],
      true,
    );
    expect(Object.keys(store().bonds).sort()).toEqual([
      "captain:kira",
      "captain:vex",
      "harbour:kira",
    ]);
    expect(store().loading["entry:captain"]).toBe(false);

    // A change from realtime shows in both views.
    onEntry.captain([bond("harbour", "kira")], [], false);
    expect(store().bonds["harbour:kira"]).toBeDefined();

    // Leaving the entry keeps the bonds the character sheet still shows.
    stopEntry();
    expect(stopped).toEqual(["entry:captain"]);
    expect(Object.keys(store().bonds).sort()).toEqual([
      "captain:kira",
      "harbour:kira",
    ]);
    stopCharacter();
    expect(store().bonds).toEqual({});
  });

  it("counts listeners and stops on the last one", () => {
    const first = store().listenToEntryBonds("captain");
    const second = store().listenToEntryBonds("captain");
    expect(WorldEntryBondsService.listenToEntryBonds).toHaveBeenCalledTimes(1);
    first();
    expect(stopped).toEqual([]);
    second();
    expect(stopped).toEqual(["entry:captain"]);
  });

  it("replaces only its own scope and drops removed bonds", () => {
    const stop = store().listenToEntryBonds("captain");
    useWorldEntryBondsStore.setState((state) => {
      state.bonds["harbour:kira"] = bond("harbour", "kira");
    });
    onEntry.captain(
      [bond("captain", "kira"), bond("captain", "vex")],
      [],
      true,
    );
    onEntry.captain([bond("captain", "kira")], [], true);
    onEntry.captain([], [{ entryId: "captain", characterId: "kira" }], false);
    expect(Object.keys(store().bonds)).toEqual(["harbour:kira"]);
    stop();
  });

  it("reads connections by game and drops them with the last listener", () => {
    let onConnections: (
      changed: IWorldEntryConnection[],
      removedIds: string[],
      replace: boolean,
    ) => void = () => {};
    vi.spyOn(
      WorldEntryBondsService,
      "listenToGameConnections",
    ).mockImplementation((_, callback) => {
      onConnections = callback;
      return () => stopped.push("game");
    });
    const stop = store().listenToGameConnections("game");
    onConnections([connection("a"), connection("b")], [], true);
    onConnections([connection("a", { ticks: 8 })], ["b"], false);
    expect(Object.keys(store().connections)).toEqual(["a"]);
    expect(store().connections.a.ticks).toBe(8);
    stop();
    expect(stopped).toEqual(["game"]);
    expect(store().connections).toEqual({});
  });

  it("shows a progress change at once and undoes it if refused", async () => {
    useWorldEntryBondsStore.setState((state) => {
      state.connections.a = connection("a", { ticks: 4 });
    });
    let refuse: (error: Error) => void = () => {};
    vi.spyOn(WorldEntryBondsService, "updateConnection").mockReturnValue(
      new Promise((_, reject) => {
        refuse = reject;
      }),
    );
    const update = store().updateConnection("a", { ticks: 12 });
    expect(store().connections.a.ticks).toBe(12);
    refuse(new Error("refused"));
    await expect(update).rejects.toThrow("refused");
    expect(store().connections.a.ticks).toBe(4);
  });

  it("makes, shares and removes connections", async () => {
    vi.spyOn(WorldEntryBondsService, "addConnection").mockResolvedValue(
      connection("a"),
    );
    vi.spyOn(WorldEntryBondsService, "updateConnection").mockResolvedValue(
      connection("a", { characterId: null }),
    );
    vi.spyOn(WorldEntryBondsService, "removeConnection").mockResolvedValue();
    const id = await store().addConnection({
      entryId: "captain",
      gameId: "game",
      characterId: "kira",
      rank: Difficulty.Dangerous,
    });
    expect(id).toBe("a");
    await store().updateConnection("a", { characterId: null });
    expect(store().connections.a.characterId).toBeNull();
    await store().removeConnection("a");
    expect(store().connections.a).toBeUndefined();
  });

  it("adds and removes bonds", async () => {
    const stop = store().listenToCharacterBonds("kira");
    vi.spyOn(WorldEntryBondsService, "addBond").mockResolvedValue(
      bond("captain", "kira"),
    );
    vi.spyOn(WorldEntryBondsService, "removeBond").mockResolvedValue();
    await store().addBond({ entryId: "captain", characterId: "kira" });
    expect(store().bonds["captain:kira"]).toBeDefined();
    await store().removeBond({ entryId: "captain", characterId: "kira" });
    expect(store().bonds["captain:kira"]).toBeUndefined();
    stop();
  });
});
