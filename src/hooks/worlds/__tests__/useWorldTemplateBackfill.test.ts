import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorldTemplateBackfill } from "../useWorldTemplateBackfill";

const mocks = vi.hoisted(() => ({
  seed: vi.fn(),
  world: { world: { id: "world", settingKey: null }, worldPermission: "owner" },
  categories: {
    worldId: "world",
    categories: {} as Record<string, { worldId: string }>,
    loading: false,
    error: undefined,
  },
  context: {
    catalog: { replacementMap: {} },
    loading: false,
    error: undefined as string | undefined,
    retry: vi.fn(),
  },
}));
vi.mock("stores/world.store", () => ({
  useWorldStore: (selector: (state: typeof mocks.world) => unknown) =>
    selector(mocks.world),
}));
vi.mock("stores/worldCategories.store", () => ({
  useWorldCategoriesStore: (
    selector: (state: typeof mocks.categories) => unknown,
  ) => selector(mocks.categories),
}));
vi.mock("components/worlds/worldOracleContext", () => ({
  useWorldOracleContext: () => mocks.context,
}));
vi.mock("repositories/worldTemplates.repository", () => ({
  WorldTemplatesRepository: { seedWorld: mocks.seed },
}));

beforeEach(() => {
  mocks.seed.mockReset().mockResolvedValue(true);
  mocks.world.worldPermission = "owner";
  mocks.categories.worldId = "world";
  mocks.categories.categories = {};
  mocks.categories.loading = false;
  mocks.context.loading = false;
  mocks.context.error = undefined;
});
describe("template backfill", () => {
  it("waits for correct loaded world and catalog", async () => {
    mocks.categories.worldId = "previous";
    const { rerender } = renderHook(() => useWorldTemplateBackfill("world"));
    expect(mocks.seed).not.toHaveBeenCalled();
    mocks.categories.worldId = "world";
    mocks.context.loading = true;
    rerender();
    expect(mocks.seed).not.toHaveBeenCalled();
    mocks.context.loading = false;
    rerender();
    await waitFor(() => expect(mocks.seed).toHaveBeenCalledTimes(1));
  });
  it("skips customized worlds and readers", () => {
    mocks.categories.categories = { existing: { worldId: "world" } };
    const { rerender } = renderHook(() => useWorldTemplateBackfill("world"));
    expect(mocks.seed).not.toHaveBeenCalled();
    mocks.categories.categories = {};
    mocks.world.worldPermission = "viewer";
    rerender();
    expect(mocks.seed).not.toHaveBeenCalled();
  });
  it("surfaces errors and only retries after explicit action", async () => {
    mocks.seed.mockRejectedValueOnce(new Error("Offline"));
    const { result, rerender } = renderHook(() =>
      useWorldTemplateBackfill("world"),
    );
    await waitFor(() => expect(result.current.error).toBe("Offline"));
    rerender();
    expect(mocks.seed).toHaveBeenCalledTimes(1);
    act(() => result.current.retry());
    await waitFor(() => expect(mocks.seed).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeUndefined();
  });
});
