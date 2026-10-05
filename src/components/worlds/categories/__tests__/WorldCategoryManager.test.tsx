import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  RouterProvider,
  createMemoryRouter,
  useLocation,
  useNavigate,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type WorldNavigation,
  type WorldView,
  getWorldViewPath,
} from "components/worlds/worldNavigation";

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
vi.mock("hooks/useWorldOracles", () => ({
  useWorldOracles: () => state.oracle,
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/worldCategories.store", () => ({
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
  world: {
    id: category.worldId,
    name: "Ironlands",
    description: null,
    settingKey: null,
    configurationCustomized: false,
    createdBy: "owner",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  layout: "page" as const,
  rootBreadcrumb: { key: "worlds", label: "Worlds", linkProps: { href: "/" } },
  permission: WorldPermission.Owner,
  generalSettings: <h2>General world settings</h2>,
};

const settingsLink = (name: string) =>
  within(
    screen.getByRole("navigation", { name: "World settings navigation" }),
  ).getByRole("link", { name });

const categoryName = () =>
  screen.getByRole("textbox", { name: /Category name/ });

function ManagerHarness({
  permission = WorldPermission.Owner,
}: {
  permission?: WorldPermission;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const categoryMatch = location.pathname.match(
    /\/settings\/categories\/([^/]+)$/,
  );
  const navigation: WorldNavigation = {
    view: categoryMatch
      ? { type: "category-settings", categoryId: categoryMatch[1] }
      : location.pathname.endsWith("/settings")
        ? { type: "settings" }
        : { type: "world" },
    getLinkProps: (view) => ({
      href: getWorldViewPath(category.worldId, view),
    }),
    navigate: (view) => navigate(getWorldViewPath(category.worldId, view)),
  };
  return (
    <WorldCategoryManager
      {...props}
      permission={permission}
      navigation={navigation}
    />
  );
}

function managerView(
  permission = WorldPermission.Owner,
  initialView: WorldView = { type: "settings" },
) {
  return (
    <MemoryRouter
      initialEntries={[getWorldViewPath(category.worldId, initialView)]}
    >
      <ManagerHarness permission={permission} />
    </MemoryRouter>
  );
}

async function openCategorySettings(
  user: ReturnType<typeof userEvent.setup>,
  name = "Locations",
) {
  await user.click(settingsLink(name));
}

describe("WorldCategoryManager", () => {
  it("waits for custom category snapshots without flashing an unavailable category", () => {
    state.configurationCustomized = true;
    state.loading = true;
    state.categories = {};
    const destination: WorldView = {
      type: "category-settings",
      categoryId: category.id,
    };
    const view = render(managerView(WorldPermission.Owner, destination));
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.queryByText("This category is no longer available."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "General world settings" }),
    ).not.toBeInTheDocument();
    state.categories = { [category.id]: category };
    state.loading = false;
    view.rerender(managerView(WorldPermission.Owner, destination));
    expect(categoryName()).toHaveValue("Locations");
    expect(
      screen.queryByText("This category is no longer available."),
    ).not.toBeInTheDocument();
  });

  it("opens category settings directly and restores its destination with browser Back", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [{ path: "*", element: <ManagerHarness /> }],
      {
        initialEntries: [
          getWorldViewPath(category.worldId, {
            type: "category-settings",
            categoryId: category.id,
          }),
        ],
      },
    );
    render(<RouterProvider router={router} />);
    expect(categoryName()).toHaveValue("Locations");
    expect(
      screen.queryByRole("heading", { name: "General world settings" }),
    ).not.toBeInTheDocument();
    await user.click(settingsLink("General"));
    expect(
      screen.getByRole("heading", { name: "General world settings" }),
    ).toBeInTheDocument();
    await act(() => router.navigate(-1));
    expect(categoryName()).toHaveValue("Locations");
    expect(settingsLink("Locations")).toHaveAttribute("aria-current", "page");
  });

  it("uses linked destinations for General and category settings", async () => {
    const user = userEvent.setup();
    render(managerView());
    expect(
      screen.getByRole("heading", { name: "General world settings" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(settingsLink("Locations")).toHaveAttribute(
      "href",
      getWorldViewPath(category.worldId, {
        type: "category-settings",
        categoryId: category.id,
      }),
    );
    await openCategorySettings(user);
    expect(categoryName()).toBeEnabled();
    expect(
      screen.queryByRole("heading", { name: "General world settings" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Done" }),
    ).not.toBeInTheDocument();
    expect(categoryName()).toHaveValue("Locations");
    expect(settingsLink("Locations")).toHaveAttribute("aria-current", "page");
    await user.click(settingsLink("General"));
    expect(
      screen.getByRole("heading", { name: "General world settings" }),
    ).toBeInTheDocument();
  });

  it("keeps a removed category destination explicit and offers a root link", async () => {
    const user = userEvent.setup();
    const view = render(managerView());
    await openCategorySettings(user);
    state.categories = {};
    view.rerender(managerView());
    expect(
      screen.getByText("This category is no longer available."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "General world settings" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to world" })).toHaveAttribute(
      "href",
      getWorldViewPath(category.worldId, { type: "world" }),
    );
    await user.click(screen.getByRole("link", { name: "Back to world" }));
    expect(
      screen.getByRole("region", { name: "Ironlands categories" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("blocks inherited edits during oracle refresh and exposes retry after failure", async () => {
    const user = userEvent.setup();
    state.oracle.loading = true;
    const view = render(managerView());
    expect(screen.getByRole("button", { name: "Add category" })).toBeDisabled();
    await openCategorySettings(user);
    expect(categoryName()).toBeDisabled();
    state.oracle.loading = false;
    state.oracle.error = "Catalog unavailable";
    view.rerender(managerView());
    expect(screen.getByText("Catalog unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add category" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(state.oracle.retry).toHaveBeenCalledOnce();
    state.oracle.error = undefined;
    view.rerender(managerView());
    expect(categoryName()).toBeEnabled();
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
    render(managerView());
    await openCategorySettings(user, "NPCs");
    const navigation = screen.getByRole("navigation", {
      name: "World settings navigation",
    });
    expect(
      within(navigation)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["General", "Locations", "NPCs"]);
    expect(screen.queryByText("Foreign")).not.toBeInTheDocument();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const top = this.closest("li")?.textContent?.includes("NPCs") ? 100 : 0;
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
    expect(settingsLink("NPCs")).toHaveAttribute("aria-current", "page");
  });

  it("blocks deletion of a populated category and names the count", async () => {
    const user = userEvent.setup();
    vi.spyOn(WorldCategoriesService, "getCategoryCounts").mockResolvedValue({
      entryCount: 2,
      valueCounts: {},
    });
    render(managerView(WorldPermission.Editor));
    await openCategorySettings(user);
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
    render(managerView());
    await openCategorySettings(user);
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

  it("saves category details inline without a dialog", async () => {
    const user = userEvent.setup();
    state.updateCategory.mockResolvedValue(undefined);
    render(managerView());
    await openCategorySettings(user);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.type(categoryName(), " updated");
    await waitFor(
      () =>
        expect(state.updateCategory).toHaveBeenCalledWith(category.id, {
          name: "Locations updated",
        }),
      { timeout: 2000 },
    );
    await user.click(screen.getByRole("checkbox", { name: "Supports maps" }));
    expect(state.updateCategory).toHaveBeenCalledWith(category.id, {
      supportsMap: true,
    });
    expect(
      screen.getByRole("checkbox", { name: "Supports maps" }),
    ).toBeChecked();
    expect(settingsLink("Locations")).toHaveAttribute("aria-current", "page");
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
    render(managerView());
    await user.click(screen.getByRole("button", { name: "Add category" }));
    await user.type(
      screen.getByRole("textbox", { name: /Category name/ }),
      "Creatures",
    );
    await user.click(screen.getByRole("button", { name: "Create category" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(state.createCategory).toHaveBeenCalledWith(
      category.worldId,
      expect.objectContaining({ name: "Creatures", sortOrder: 1 }),
    );
    // Router navigation runs in a transition, so wait for it to commit.
    await waitFor(() =>
      expect(settingsLink("Creatures")).toHaveAttribute("aria-current", "page"),
    );
    expect(categoryName()).toHaveValue("Creatures");
  });

  it("hides guide deletes and gives viewers read-only settings", async () => {
    const user = userEvent.setup();
    const view = render(managerView(WorldPermission.Guide));
    await openCategorySettings(user);
    expect(screen.getByRole("button", { name: "Add category" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Delete Locations" }),
    ).not.toBeInTheDocument();
    view.rerender(managerView(WorldPermission.Viewer));
    expect(
      screen.queryByRole("button", { name: "Add category" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reorder Locations" }),
    ).not.toBeInTheDocument();
    expect(categoryName()).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Supports maps" }),
    ).toBeDisabled();
  });
});
