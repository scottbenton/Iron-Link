import { act, fireEvent, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorldResourcesStore } from "stores/worldResources.store";

import type { WorldOracleCatalog } from "lib/worldOracleCatalog";

import { useWorldOracles } from "../useWorldOracles";

const state = vi.hoisted(() => ({
  worldId: "world-a",
  catalog: null as WorldOracleCatalog | null,
  loading: true,
  error: undefined as string | undefined,
  allPackages: false,
  setAllPackages: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("stores/worldResources.store", async () => {
  const { createWithEqualityFn } = await import("zustand/traditional");
  const { default: deepEqual } = await import("fast-deep-equal");
  return {
    useWorldResourcesStore: createWithEqualityFn(
      () => ({ ...state }),
      deepEqual,
    ),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(state, {
    worldId: "world-a",
    catalog: null,
    loading: true,
    error: undefined,
    allPackages: false,
  });
  useWorldResourcesStore.setState(state);
});

describe("useWorldOracles", () => {
  it("exposes matching resource state and delegates controls to its world", () => {
    state.catalog = {} as WorldOracleCatalog;
    state.loading = false;
    state.error = "Example failure";
    state.allPackages = true;
    useWorldResourcesStore.setState(state);
    const { result } = renderHook(() => useWorldOracles("world-a"));
    expect(result.current).toMatchObject({
      worldId: "world-a",
      catalog: state.catalog,
      loading: false,
      error: "Example failure",
      allPackages: true,
    });
    act(() => result.current.setAllPackages(false));
    act(() => result.current.retry());
    expect(state.setAllPackages).toHaveBeenCalledWith("world-a", false);
    expect(state.refresh).toHaveBeenCalledWith("world-a");
  });

  it("hides another world's state but keeps controls bound to the requested world", () => {
    state.catalog = {} as WorldOracleCatalog;
    state.loading = false;
    state.error = "Other world error";
    state.allPackages = true;
    useWorldResourcesStore.setState(state);
    const { result } = renderHook(() => useWorldOracles("world-b"));
    expect(result.current).toMatchObject({
      worldId: "world-b",
      catalog: null,
      loading: true,
      error: undefined,
      allPackages: false,
    });
    act(() => result.current.setAllPackages(true));
    act(() => result.current.retry());
    expect(state.setAllPackages).toHaveBeenCalledWith("world-b", true);
    expect(state.refresh).toHaveBeenCalledWith("world-b");
  });

  it("tracks requested-world and resource-world switches without starting subscriptions or fetches", () => {
    state.catalog = {} as WorldOracleCatalog;
    state.loading = false;
    useWorldResourcesStore.setState(state);
    const hook = renderHook(({ worldId }) => useWorldOracles(worldId), {
      initialProps: { worldId: "world-a" },
    });
    expect(hook.result.current.catalog).toBe(state.catalog);
    hook.rerender({ worldId: "world-b" });
    expect(hook.result.current.catalog).toBeNull();
    expect(hook.result.current.loading).toBe(true);
    act(() => useWorldResourcesStore.setState({ worldId: "world-b" }));
    expect(hook.result.current.catalog).toBe(state.catalog);
    expect(hook.result.current.loading).toBe(false);
    act(() =>
      useWorldResourcesStore.setState({
        loading: true,
        error: "Refresh failure",
        allPackages: true,
      }),
    );
    expect(hook.result.current.loading).toBe(true);
    expect(hook.result.current.error).toBe("Refresh failure");
    expect(hook.result.current.allPackages).toBe(true);
    expect(state.refresh).not.toHaveBeenCalled();
    expect(state.setAllPackages).not.toHaveBeenCalled();
    act(() => hook.result.current.retry());
    expect(state.refresh).toHaveBeenCalledWith("world-b");
    state.refresh.mockClear();
    fireEvent.focus(window);
    hook.unmount();
    expect(state.refresh).not.toHaveBeenCalled();
    expect(state.setAllPackages).not.toHaveBeenCalled();
  });
});
