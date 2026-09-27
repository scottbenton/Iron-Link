import { act, render, screen, waitFor, within } from "@testing-library/react";
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
  state.loading = false;
  state.configurationCustomized = false;
  state.defaultBindingsReady = true;
  state.oracle.loading = false;
  state.oracle.error = undefined;
});

const props = {
  worldId: category.worldId,
  worldName: "Ironlands",
  permission: WorldPermission.Owner,
  configuring: true,
  onDone: vi.fn(),
  generalSettings: <h2>General world settings</h2>,
};

describe("WorldCategoryManager", () => {
  it("starts on General, keeps browsing separate, and returns there after Done", async () => {
    const user = userEvent.setup();
    const view = render(<WorldCategoryManager {...props} />);
    expect(
      screen.getByRole("heading", { name: "General world settings" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Settings section" }),
      category.id,
    );
    expect(
      screen.getByRole("button", { name: "Edit Locations" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("heading", { name: "General world settings" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Done" })).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: "Done" })[0]);
    expect(props.onDone).toHaveBeenCalledOnce();
    view.rerender(<WorldCategoryManager {...props} configuring={false} />);
    expect(
      screen.getByRole("region", { name: "Ironlands categories" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "World settings navigation" }),
    ).not.toBeInTheDocument();
    view.rerender(<WorldCategoryManager {...props} />);
    expect(
      screen.getByRole("heading", { name: "General world settings" }),
    ).toBeInTheDocument();
  });

  it("shows General when another client removes the selected category", async () => {
    const user = userEvent.setup();
    const view = render(<WorldCategoryManager {...props} />);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Settings section" }),
      category.id,
    );
    state.categories = {};
    view.rerender(<WorldCategoryManager {...props} />);
    expect(
      screen.getByRole("heading", { name: "General world settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Settings section" }),
    ).toHaveValue("");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("blocks inherited edits during oracle refresh and exposes retry after failure", async () => {
    const user = userEvent.setup();
    state.oracle.loading = true;
    const view = render(<WorldCategoryManager {...props} />);
    expect(screen.getByRole("button", { name: "Add category" })).toBeDisabled();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Settings section" }),
      category.id,
    );
    expect(
      screen.getByRole("button", { name: "Edit Locations" }),
    ).toBeDisabled();
    state.oracle.loading = false;
    state.oracle.error = "Catalog unavailable";
    view.rerender(<WorldCategoryManager {...props} />);
    expect(screen.getByText("Catalog unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add category" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(state.oracle.retry).toHaveBeenCalledOnce();
    state.oracle.error = undefined;
    view.rerender(<WorldCategoryManager {...props} />);
    expect(
      screen.getByRole("button", { name: "Edit Locations" }),
    ).toBeEnabled();
  });

  it("shows ordered categories, excludes other worlds, and atomically reorders without losing selection", async () => {
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
    render(<WorldCategoryManager {...props} />);
    await user.click(
      screen.getByRole("button", { name: "Reorder categories" }),
    );
    const navigation = screen.getByRole("navigation", {
      name: "World settings navigation",
    });
    expect(
      within(navigation)
        .getAllByRole("group")
        .map((row) => row.getAttribute("aria-label")),
    ).toEqual(["Locations category", "NPCs category"]);
    expect(screen.queryByText("Foreign")).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Settings section" }),
      second.id,
    );
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
    act(() => screen.getByRole("button", { name: "Reorder NPCs" }).focus());
    await user.keyboard("[Space]");
    await user.keyboard("[ArrowUp]");
    await user.keyboard("[Space]");
    await waitFor(() =>
      expect(reorder).toHaveBeenCalledWith([second.id, category.id]),
    );
    expect(screen.getByRole("button", { name: "NPCs" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("blocks deletion of a populated category and names the count", async () => {
    const user = userEvent.setup();
    vi.spyOn(WorldCategoriesService, "getCategoryCounts").mockResolvedValue({
      entryCount: 2,
      valueCounts: {},
    });
    render(
      <WorldCategoryManager {...props} permission={WorldPermission.Editor} />,
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Settings section" }),
      category.id,
    );
    await user.click(screen.getByRole("button", { name: "Delete Locations" }));
    expect(await screen.findByText(/contains 2 entries/)).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Delete category" }),
    ).not.toBeInTheDocument();
    expect(state.deleteCategory).not.toHaveBeenCalled();
  });

  it("confirms an empty category deletion and returns to General", async () => {
    const user = userEvent.setup();
    vi.spyOn(WorldCategoriesService, "getCategoryCounts").mockResolvedValue({
      entryCount: 0,
      valueCounts: {},
    });
    state.deleteCategory.mockResolvedValue(undefined);
    render(<WorldCategoryManager {...props} />);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Settings section" }),
      category.id,
    );
    await user.click(screen.getByRole("button", { name: "Delete Locations" }));
    const dialog = await screen.findByRole("dialog");
    expect(state.deleteCategory).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(state.deleteCategory).toHaveBeenCalledWith(category.id),
    );
    expect(
      await screen.findByRole("heading", { name: "General world settings" }),
    ).toBeInTheDocument();
  });

  it("preserves no-op edit protection and saves an actual category change", async () => {
    const user = userEvent.setup();
    state.updateCategory.mockResolvedValue(undefined);
    render(<WorldCategoryManager {...props} />);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Settings section" }),
      category.id,
    );
    await user.click(screen.getByRole("button", { name: "Edit Locations" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: /Category name/ }),
      " updated",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(state.updateCategory).toHaveBeenCalledWith(
        category.id,
        expect.objectContaining({ name: "Locations updated" }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("combobox", { name: "Settings section" }),
    ).toHaveValue(category.id);
  });

  it("selects a newly created category in settings", async () => {
    const user = userEvent.setup();
    const created = {
      ...category,
      id: "new-category",
      name: "Creatures",
      sortOrder: 1,
    };
    state.createCategory.mockImplementation(async () => {
      state.categories = { [category.id]: category, [created.id]: created };
      return created.id;
    });
    render(<WorldCategoryManager {...props} />);
    await user.click(screen.getByRole("button", { name: "Add category" }));
    await user.type(
      screen.getByRole("textbox", { name: /Category name/ }),
      "Creatures",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(state.createCategory).toHaveBeenCalledWith(
      category.worldId,
      expect.objectContaining({ name: "Creatures", sortOrder: 1 }),
    );
    expect(
      screen.getByRole("combobox", { name: "Settings section" }),
    ).toHaveValue(created.id);
  });

  it("hides guide deletes and gives viewers read-only settings", async () => {
    const user = userEvent.setup();
    const view = render(
      <WorldCategoryManager {...props} permission={WorldPermission.Guide} />,
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Settings section" }),
      category.id,
    );
    expect(screen.getByRole("button", { name: "Add category" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Delete Locations" }),
    ).not.toBeInTheDocument();
    view.rerender(
      <WorldCategoryManager {...props} permission={WorldPermission.Viewer} />,
    );
    expect(
      screen.queryByRole("button", { name: "Add category" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reorder Locations" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Category configuration" }),
    );
    expect(
      screen.getByRole("textbox", { name: /Category name/ }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
  });
});
