import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorldPermission } from "repositories/shared.types";

import { WorldCategoriesService } from "services/worldCategories.service";

import { WorldCategoryManager } from "../WorldCategoryManager";
import { category, translate } from "./fixtures";

const state = vi.hoisted(() => ({
  categories: {},
  fieldDefinitions: {},
  configurationCustomized: false,
  defaultBindingsReady: true,
  reorderCategories: vi.fn(),
  loading: false,
  error: undefined,
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  oracle: {
    loading: false,
    error: undefined as string | undefined,
    retry: vi.fn(),
  },
}));
vi.mock("components/worlds/worldOracleContext", () => ({
  useWorldOracleContext: () => state.oracle,
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/worldCategories.store", () => ({
  useListenToWorldCategories: vi.fn(),
  useWorldCategoriesStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock("../WorldCategoryContents", () => ({
  WorldCategoryContents: () => null,
}));
vi.mock("../WorldCategoryFields", () => ({ WorldCategoryFields: () => null }));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  state.categories = { [category.id]: category };
  state.oracle.loading = false;
  state.oracle.error = undefined;
});

describe("WorldCategoryManager", () => {
  it("blocks inherited edits during oracle refresh and exposes retry after failure", async () => {
    const user = userEvent.setup();
    state.oracle.loading = true;
    const view = render(
      <WorldCategoryManager
        worldId={category.worldId}
        permission={WorldPermission.Owner}
      />,
    );
    expect(screen.getByRole("button", { name: "Add category" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Edit Locations" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Configure" }));
    expect(
      screen.getByRole("button", { name: "Edit Locations" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Close Dialog" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    state.oracle.loading = false;
    state.oracle.error = "Catalog unavailable";
    view.rerender(
      <WorldCategoryManager
        worldId={category.worldId}
        permission={WorldPermission.Owner}
      />,
    );
    expect(screen.getByText("Catalog unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add category" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(state.oracle.retry).toHaveBeenCalledOnce();
  });

  it("shows ordered categories, excludes other worlds, and atomically moves the selection", async () => {
    const user = userEvent.setup();
    const second = { ...category, id: "second", name: "NPCs", sortOrder: 1 };
    state.categories = {
      second,
      [category.id]: category,
      foreign: {
        ...category,
        id: "foreign",
        worldId: "other",
        name: "Foreign",
      },
    };
    const reorder = state.reorderCategories.mockResolvedValue(undefined);
    render(
      <WorldCategoryManager
        worldId={category.worldId}
        permission={WorldPermission.Owner}
      />,
    );
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Locations",
      "NPCs",
    ]);
    await user.click(screen.getByRole("tab", { name: "NPCs" }));
    await user.click(screen.getByRole("button", { name: "Configure" }));
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const top = this.closest('[aria-label="NPCs category"]') ? 100 : 0;
        return {
          top,
          bottom: top + 80,
          left: 0,
          right: 400,
          width: 400,
          height: 80,
          x: 0,
          y: top,
          toJSON: () => ({}),
        };
      },
    );
    screen.getByRole("button", { name: "Reorder NPCs" }).focus();
    await user.keyboard("[Space]");
    await user.keyboard("[ArrowUp]");
    await user.keyboard("[Space]");
    await waitFor(() =>
      expect(reorder).toHaveBeenCalledWith([second.id, category.id]),
    );
  });

  it("blocks deletion of a populated category and names the count", async () => {
    const user = userEvent.setup();
    vi.spyOn(WorldCategoriesService, "getCategoryCounts").mockResolvedValue({
      entryCount: 2,
      valueCounts: {},
    });
    render(
      <WorldCategoryManager
        worldId={category.worldId}
        permission={WorldPermission.Editor}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Configure" }));
    await user.click(screen.getByRole("button", { name: "Delete Locations" }));
    expect(await screen.findByText(/contains 2 entries/)).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Delete category" }),
    ).not.toBeInTheDocument();
    expect(state.deleteCategory).not.toHaveBeenCalled();
  });

  it("hides guide deletes and shows a reader empty state", () => {
    const view = render(
      <WorldCategoryManager
        worldId={category.worldId}
        permission={WorldPermission.Guide}
      />,
    );
    expect(screen.getByRole("button", { name: "Add category" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Delete Locations" }),
    ).not.toBeInTheDocument();
    state.categories = {};
    view.rerender(
      <WorldCategoryManager
        worldId={category.worldId}
        permission={WorldPermission.Viewer}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Add category" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("This world has no categories yet."),
    ).toBeInTheDocument();
  });
});
