import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useNotesStore } from "stores/notes.store";

import { useListenToGameWorld } from "../hooks/useGameWorld";

const state = vi.hoisted(() => ({
  game: { worldId: "world-a" as string | null },
  world: { id: "world-a" },
  worldDeleted: false,
  enabled: true,
  listenWorld: vi.fn(),
  listenConfiguration: vi.fn(),
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("hooks/advancedFeatures/advancedFeatures", () => ({
  useAdvancedFeatureToggle: () => state.enabled,
}));
vi.mock("stores/world.store", () => ({
  useListenToWorld: state.listenWorld,
  useWorldStore: (select: (value: typeof state) => unknown) => select(state),
}));
vi.mock("stores/worldCategories.store", () => ({
  useListenToWorldConfiguration: state.listenConfiguration,
}));
vi.mock("stores/game.store", () => ({
  GamePermission: { Guide: "guide" },
  useGameStore: (select: (value: typeof state) => unknown) => select(state),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useNotesStore.getState().reset();
  state.game.worldId = "world-a";
  state.world = { id: "world-a" };
  state.worldDeleted = false;
  state.enabled = true;
  const open = useNotesStore.getState().openItemTab;
  open({
    type: "world",
    id: "world-a",
    worldView: { type: "category", categoryId: "locations" },
    replaceCurrent: false,
    openInBackground: true,
  });
  open({
    type: "world",
    id: "world-a",
    worldView: { type: "settings" },
    replaceCurrent: false,
    openInBackground: true,
  });
  open({
    type: "world",
    id: "world-b",
    replaceCurrent: false,
    openInBackground: true,
  });
  open({ type: "folder", id: "reader-notes", replaceCurrent: false });
});

function worldTabIds() {
  return Object.values(useNotesStore.getState().noteTabItems)
    .filter((item) => item.type === "world")
    .map((item) => item.itemId);
}

describe("Persistent game world subscription owner", () => {
  it("closes all deleted-world destinations while a Notes folder is active", () => {
    const hook = renderHook(useListenToGameWorld);
    state.worldDeleted = true;
    hook.rerender();
    expect(worldTabIds()).toEqual(["world-b"]);
    const store = useNotesStore.getState();
    expect(store.noteTabItems[store.openTabId!]).toEqual({
      type: "folder",
      itemId: "reader-notes",
    });
    expect(state.listenWorld).toHaveBeenLastCalledWith("world-a");
    expect(state.listenConfiguration).toHaveBeenLastCalledWith("world-a");
  });

  it("ignores a stale deletion for another loaded world", () => {
    const hook = renderHook(useListenToGameWorld);
    state.world = { id: "world-b" };
    state.worldDeleted = true;
    hook.rerender();
    expect(worldTabIds()).toEqual(["world-a", "world-a", "world-b"]);
  });

  it.each([null, "world-b"])(
    "closes only old destinations when a remote guide changes the link to %s",
    (replacement) => {
      const hook = renderHook(useListenToGameWorld);
      state.game.worldId = replacement;
      hook.rerender();
      expect(worldTabIds()).toEqual(["world-b"]);
      state.worldDeleted = true;
      hook.rerender();
      expect(worldTabIds()).toEqual(["world-b"]);
    },
  );
});
