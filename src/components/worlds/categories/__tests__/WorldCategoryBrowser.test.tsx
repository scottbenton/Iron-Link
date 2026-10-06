import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorldStore } from "stores/world.store";

import { WorldPermission } from "repositories/shared.types";

import type { IWorldCategory } from "services/worldCategories.service";
import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import { WorldBrowserRouteFixture } from "./WorldBrowserRouteFixture";
import { category, translate } from "./fixtures";

const state = vi.hoisted(() => ({
  categories: {} as Record<string, IWorldCategory>,
  fieldDefinitions: {},
  configurationCustomized: false,
  defaultBindingsReady: true,
  loading: false,
  error: undefined,
  oracle: { loading: false, error: undefined, retry: () => {} },
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("hooks/useWorldOracles", () => ({
  useWorldOracles: () => state.oracle,
}));
vi.mock("../WorldCategoryFields", () => ({ WorldCategoryFields: () => null }));
vi.mock("stores/worldCategories.store", () => ({
  useWorldCategoriesStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock("stores/auth.store", () => ({ useUID: () => "reader" }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
beforeEach(() => {
  vi.restoreAllMocks();
  state.oracle.loading = false;
  useWorldStore.setState({ worldPermission: WorldPermission.Viewer });
});

function renderBrowser(
  path = `/worlds/${category.worldId}`,
  props: Parameters<typeof WorldBrowserRouteFixture>[0] & {
    categories?: IWorldCategory[];
  } = {},
) {
  const { categories = [category], ...fixtureProps } = props;
  state.categories = Object.fromEntries(
    categories.map((item) => [item.id, item]),
  );
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/worlds/:worldId"
          element={<WorldBrowserRouteFixture {...fixtureProps} />}
        />
        <Route
          path="/worlds/:worldId/categories/:categoryId"
          element={<WorldBrowserRouteFixture {...fixtureProps} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("WorldCategoryBrowser routes", () => {
  it("opens a category link, searches permitted entries, and returns through the shared breadcrumb", async () => {
    const user = userEvent.setup();
    const unsubscribe = vi.fn();
    const listen = vi
      .spyOn(WorldEntriesService, "listenToWorldEntries")
      .mockReturnValue(unsubscribe);
    renderBrowser();
    expect(listen).not.toHaveBeenCalled();
    const folder = screen.getByRole("link", { name: "Locations" });
    expect(folder).toHaveAttribute(
      "href",
      `/worlds/${category.worldId}/categories/${category.id}`,
    );
    await user.click(folder);
    expect(
      screen.getByRole("navigation", { name: "Breadcrumbs" }),
    ).toHaveTextContent("Worlds/Ironlands/Locations");
    expect(
      screen.getByRole("heading", { name: "Locations" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Locations settings" }),
    ).toHaveAttribute(
      "href",
      `/worlds/${category.worldId}/settings/categories/${category.id}`,
    );
    expect(listen).toHaveBeenCalledWith(
      "reader",
      category.worldId,
      WorldPermission.Viewer,
      expect.any(Function),
      expect.any(Function),
    );
    act(() =>
      listen.mock.calls[0][3](
        {
          one: {
            id: "one",
            categoryId: category.id,
            name: "Frosthaven",
          } as IWorldEntry,
          two: {
            id: "two",
            categoryId: category.id,
            name: "Winterhall",
          } as IWorldEntry,
        },
        [],
        true,
      ),
    );
    expect(
      screen.queryByRole("button", { name: "Frosthaven" }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Search entries" }),
      "FROST",
    );
    expect(screen.getByText("Frosthaven")).toBeInTheDocument();
    expect(screen.queryByText("Winterhall")).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Ironlands" }));
    expect(screen.getByRole("link", { name: "Locations" })).toBeInTheDocument();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
  it("loads a category destination directly and reports deleted or foreign categories", () => {
    vi.spyOn(WorldEntriesService, "listenToWorldEntries").mockReturnValue(
      vi.fn(),
    );
    const view = renderBrowser(
      `/worlds/${category.worldId}/categories/${category.id}`,
    );
    expect(
      screen.getByRole("heading", { name: "Locations" }),
    ).toBeInTheDocument();
    view.unmount();
    renderBrowser(`/worlds/${category.worldId}/categories/foreign`, {
      categories: [{ ...category, id: "foreign", worldId: "other-world" }],
    });
    expect(
      screen.getByText("This category is no longer available."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to world" })).toHaveAttribute(
      "href",
      `/worlds/${category.worldId}`,
    );
    expect(
      screen.queryByRole("textbox", { name: "Search entries" }),
    ).not.toBeInTheDocument();
  });
  it("keeps add disabled during unavailable editor configuration and hides it for readers", () => {
    state.oracle.loading = true;
    const view = renderBrowser(undefined, {
      permission: WorldPermission.Owner,
    });
    expect(screen.getByRole("button", { name: "Add category" })).toBeDisabled();
    view.unmount();
    renderBrowser();
    expect(
      screen.queryByRole("button", { name: "Add category" }),
    ).not.toBeInTheDocument();
  });
});
