import { act, renderHook } from "@testing-library/react";
import {
  type MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { useListenToGameWorld } from "pages/games/characterSheet/components/NotesSection/hooks/useGameWorld";

import { useNotesStore } from "stores/notes.store";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import { WorldPermission } from "repositories/shared.types";

import {
  IWorldPlayer,
  WorldPlayersService,
} from "services/worldPlayers.service";
import { IWorld, WorldsService } from "services/worlds.service";

import { useWorldStore } from "../world.store";

const game = vi.hoisted(() => ({ game: { worldId: "world-a" } }));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("../auth.store", () => ({ useUID: () => "reader" }));
vi.mock("hooks/advancedFeatures/advancedFeatures", () => ({
  useAdvancedFeatureToggle: () => true,
}));
vi.mock("../game.store", () => ({
  GamePermission: { Guide: "guide" },
  useGameStore: (select: (state: typeof game) => unknown) => select(game),
}));
vi.mock("../worldCategories.store", () => ({
  useListenToWorldCategories: vi.fn(),
}));

let worlds: MockInstance<typeof WorldsService.listenToWorld>;
let players: MockInstance<typeof WorldPlayersService.listenToWorldPlayers>;
let stops: (() => void)[];
const world = (id: string): IWorld => ({
  id,
  name: id,
  description: null,
  settingKey: null,
  configurationCustomized: false,
  createdBy: "reader",
  createdAt: new Date(),
  updatedAt: new Date(),
});
const failure = new Error("Late error") as RepositoryError;

beforeEach(() => {
  vi.restoreAllMocks();
  stops = [];
  worlds = vi.spyOn(WorldsService, "listenToWorld").mockReturnValue(vi.fn());
  players = vi
    .spyOn(WorldPlayersService, "listenToWorldPlayers")
    .mockReturnValue(vi.fn());
  vi.spyOn(WorldsService, "getWorldPermission").mockResolvedValue(
    WorldPermission.Viewer,
  );
  game.game.worldId = "world-a";
  useNotesStore.getState().reset();
});
afterEach(() => {
  stops.forEach((stop) => stop());
});

function listen(id: string) {
  const stop = useWorldStore.getState().listenToWorld(id);
  stops.push(stop);
  return stop;
}

describe("World subscription lifetime", () => {
  it.each(["user switch", "same-world resubscription"])(
    "ignores an outdated same-world role after %s",
    async (change) => {
      const lookup = vi.mocked(WorldsService.getWorldPermission);
      let oldResult!: (permission: WorldPermission) => void;
      let newResult!: (permission: WorldPermission) => void;
      lookup.mockReturnValueOnce(
        new Promise((resolve) => {
          oldResult = resolve;
        }),
      );
      lookup.mockReturnValueOnce(
        new Promise((resolve) => {
          newResult = resolve;
        }),
      );
      listen("world-a");
      useWorldStore.getState().loadWorldPermission("world-a", "previous-user");
      if (change === "same-world resubscription") listen("world-a");
      useWorldStore
        .getState()
        .loadWorldPermission(
          "world-a",
          change === "user switch" ? "current-user" : "previous-user",
        );
      await act(async () => newResult(WorldPermission.Viewer));
      await act(async () => oldResult(WorldPermission.Owner));
      expect(useWorldStore.getState().worldPermission).toBe(
        WorldPermission.Viewer,
      );
    },
  );

  it("ignores old reads, deletes, errors and membership events after switching worlds", () => {
    const stop = listen("world-a");
    worlds.mock.calls[0][1](world("world-a"));
    stop();
    listen("world-b");
    worlds.mock.calls[1][1](world("world-b"));
    const expected = useWorldStore.getState();
    worlds.mock.calls[0][1](world("world-a"));
    worlds.mock.calls[0][2]();
    worlds.mock.calls[0][3](failure);
    players.mock.calls[0][1](
      { stale: { id: "stale" } as unknown as IWorldPlayer },
      [],
      true,
    );
    players.mock.calls[0][2](failure);
    expect(useWorldStore.getState()).toBe(expected);
    expect(useWorldStore.getState().worldDeleted).toBe(false);
  });

  it("resets deletion/loading state for a new listener and clears deletion on a valid current read", () => {
    listen("world-a");
    worlds.mock.calls[0][1](world("world-a"));
    worlds.mock.calls[0][2]();
    expect(useWorldStore.getState().worldDeleted).toBe(true);
    listen("world-b");
    expect(useWorldStore.getState()).toMatchObject({
      worldId: "world-b",
      world: null,
      worldDeleted: false,
      loading: true,
      error: undefined,
    });
    worlds.mock.calls[1][2]();
    worlds.mock.calls[1][1](world("world-b"));
    expect(useWorldStore.getState()).toMatchObject({
      worldId: "world-b",
      worldDeleted: false,
      loading: false,
    });
  });

  it("does not let an obsolete same-world owner reset or update a newer subscription", () => {
    const oldStop = listen("world-a");
    listen("world-a");
    worlds.mock.calls[1][1](world("world-a"));
    oldStop();
    worlds.mock.calls[0][2]();
    expect(useWorldStore.getState()).toMatchObject({
      worldId: "world-a",
      worldDeleted: false,
      loading: false,
    });
  });

  it("keeps new-world Notes destinations open after old-world callbacks arrive late", async () => {
    useNotesStore.getState().openItemTab({
      type: "world",
      id: "world-b",
    });
    useNotesStore
      .getState()
      .openItemTab({ type: "folder", id: "notes", replaceCurrent: false });
    const hook = renderHook(useListenToGameWorld);
    await act(async () => worlds.mock.calls[0][1](world("world-a")));
    game.game.worldId = "world-b";
    hook.rerender();
    await act(async () => worlds.mock.calls[1][1](world("world-b")));
    await act(async () => {
      worlds.mock.calls[0][2]();
      worlds.mock.calls[0][3](failure);
      worlds.mock.calls[0][1](world("world-a"));
    });
    expect(useWorldStore.getState()).toMatchObject({
      worldId: "world-b",
      worldDeleted: false,
      error: undefined,
    });
    expect(Object.values(useNotesStore.getState().noteTabItems)).toContainEqual(
      {
        type: "world",
        itemId: "world-b",
      },
    );
    hook.unmount();
  });
});
