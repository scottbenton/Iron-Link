import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorldConfigurationService } from "services/worldConfiguration.service";
import { WorldPlaysetsService } from "services/worldPlaysets.service";
import type { IWorld } from "services/worlds.service";

import { useWorldStore } from "../world.store";
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
