import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorldConfigurationService } from "services/worldConfiguration.service";
import { WorldPlayersService } from "services/worldPlayers.service";
import { WorldPlaysetsService } from "services/worldPlaysets.service";
import { type IWorld, WorldsService } from "services/worlds.service";

import {
  useListenToWorld,
  useWorldPermissionControlsShown,
  useWorldStore,
} from "../world.store";
import {
  useListenToWorldConfiguration,
  useWorldCategoriesStore,
} from "../worldCategories.store";
import { useListenToWorldOracles } from "../worldOracles.store";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const world = (updatedAt: number): IWorld => ({
  id: "world",
  name: "World",
  description: null,
  settingKey: null,
  createdBy: "owner",
  createdAt: new Date(0),
  updatedAt: new Date(updatedAt),
});

afterEach(() => vi.restoreAllMocks());

// The database bumps the world row when inherited defaults or linked game
// playsets change, without touching any category or field rows.
describe("world row invalidation", () => {
  it("re-reads inherited configuration when the world row changes", () => {
    const refresh = vi.fn(() => Promise.resolve());
    vi.spyOn(
      WorldConfigurationService,
      "listenToWorldConfiguration",
    ).mockReturnValue({ refresh, unsubscribe: vi.fn() });
    useWorldStore.setState({ world: world(1) });

    const hook = renderHook(() => useListenToWorldConfiguration("world"));
    expect(refresh).not.toHaveBeenCalled();

    act(() => useWorldStore.setState({ world: world(2) }));
    expect(refresh).toHaveBeenCalledOnce();
    hook.unmount();
  });

  it("reloads linked game playsets when the world row changes", async () => {
    const playsets = vi
      .spyOn(WorldPlaysetsService, "getLinkedGamePlaysets")
      .mockResolvedValue([]);
    useWorldStore.setState({ world: world(1) });
    useWorldCategoriesStore.setState({
      worldId: "world",
      loading: false,
      storedFieldDefinitions: {},
    });

    const hook = renderHook(() => useListenToWorldOracles("world"));
    await waitFor(() => expect(playsets).toHaveBeenCalledTimes(1));

    act(() => useWorldStore.setState({ world: world(2) }));
    await waitFor(() => expect(playsets).toHaveBeenCalledTimes(2));
    hook.unmount();
  });
});

describe("permission controls", () => {
  it("shows them once someone has restricted access, rechecking when linked games change", async () => {
    let deliverWorld: Parameters<
      typeof WorldsService.listenToWorld
    >[1] = () => {};
    vi.spyOn(WorldsService, "listenToWorld").mockImplementation(
      (_worldId, onWorld) => {
        deliverWorld = onWorld;
        return () => {};
      },
    );
    vi.spyOn(WorldPlayersService, "listenToWorldPlayers").mockReturnValue(
      () => {},
    );
    const restricted = vi
      .spyOn(WorldsService, "getWorldHasRestrictedMembers")
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const hook = renderHook(() => {
      useListenToWorld("world");
      return useWorldPermissionControlsShown();
    });
    // Hidden while loading, and when nobody has restricted access.
    expect(hook.result.current).toBe(false);
    await waitFor(() => expect(restricted).toHaveBeenCalledTimes(1));
    act(() => deliverWorld(world(1)));
    await waitFor(() => expect(restricted).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(hook.result.current).toBe(true));
    hook.unmount();
  });
});

describe("listener ownership", () => {
  it("keeps an owned configuration when a non-owning view unmounts", () => {
    let deliver: Parameters<
      typeof WorldConfigurationService.listenToWorldConfiguration
    >[1] = () => {};
    vi.spyOn(
      WorldConfigurationService,
      "listenToWorldConfiguration",
    ).mockImplementation((_worldId, onConfiguration) => {
      deliver = onConfiguration;
      return { refresh: () => Promise.resolve(), unsubscribe: vi.fn() };
    });
    useWorldStore.setState({ world: world(1) });

    const owner = renderHook(() => useListenToWorldConfiguration("world"));
    act(() =>
      deliver({
        configurationCustomized: true,
        categories: {},
        fieldDefinitions: {},
      }),
    );
    // A world tab inside a game reads the store without owning it.
    const view = renderHook(() => useListenToWorldConfiguration(undefined));
    view.unmount();

    expect(useWorldCategoriesStore.getState()).toMatchObject({
      worldId: "world",
      loading: false,
    });
    owner.unmount();
    expect(useWorldCategoriesStore.getState().worldId).toBe("");
  });
});
