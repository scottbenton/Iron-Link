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
  loading: false,
  error: undefined,
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("material-ui-confirm", () => ({ useConfirm: () => state.confirm }));
vi.mock("stores/worldCategories.store", () => ({
  useListenToWorldCategories: vi.fn(),
  useWorldCategoriesStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock("hooks/worlds/useWorldTemplateBackfill", () => ({
  useWorldTemplateBackfill: () => ({
    loading: false,
    error: undefined,
    retry: vi.fn(),
  }),
}));
vi.mock("../WorldCategoryFields", () => ({ WorldCategoryFields: () => null }));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  state.categories = { [category.id]: category };
});

describe("WorldCategoryManager", () => {
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
    const reorder = vi
      .spyOn(WorldCategoriesService, "reorderCategories")
      .mockResolvedValue(undefined);
    render(
      <WorldCategoryManager
        worldId={category.worldId}
        permission={WorldPermission.Owner}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Locations", "NPCs"]);
    await user.click(screen.getByRole("option", { name: "NPCs" }));
    await user.click(screen.getByRole("button", { name: "Move category up" }));
    await waitFor(() =>
      expect(reorder).toHaveBeenCalledWith(category.worldId, [
        second.id,
        category.id,
      ]),
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
    await user.click(screen.getByRole("button", { name: "Delete category" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "contains 2 entries",
    );
    expect(state.confirm).not.toHaveBeenCalled();
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
      screen.queryByRole("button", { name: "Delete category" }),
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
