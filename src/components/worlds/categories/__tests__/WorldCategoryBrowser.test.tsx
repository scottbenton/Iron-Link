import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorldCategoryNavigationStore } from "stores/worldCategoryNavigation.store";

import { WorldPermission } from "repositories/shared.types";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import { WorldCategoryBrowser } from "../WorldCategoryBrowser";
import { category, translate } from "./fixtures";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "reader" }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  useWorldCategoryNavigationStore.setState({ selectedCategoryIds: {} });
});

const props = {
  worldId: category.worldId,
  worldName: "Ironlands",
  permission: WorldPermission.Viewer,
  categories: [category],
  canAddCategory: false,
  onAddCategory: vi.fn(),
};

describe("WorldCategoryBrowser", () => {
  it("opens folder cards, searches permitted entry names, and returns through the breadcrumb", async () => {
    const user = userEvent.setup();
    const unsubscribe = vi.fn();
    const listen = vi
      .spyOn(WorldEntriesService, "listenToWorldEntries")
      .mockReturnValue(unsubscribe);
    render(<WorldCategoryBrowser {...props} />);
    expect(listen).not.toHaveBeenCalled();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add category" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Locations" }));
    expect(
      screen.getByRole("navigation", { name: "Category navigation" }),
    ).toBeInTheDocument();
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
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toContain("Frosthaven");
    expect(
      screen.queryByRole("button", { name: "Frosthaven" }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Search entries" }),
      "FROST",
    );
    expect(screen.getByText("Frosthaven")).toBeInTheDocument();
    expect(screen.queryByText("Winterhall")).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Search entries" }),
      "none",
    );
    expect(
      screen.getByText("No entries match your search."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Categories" }));
    expect(
      screen.getByRole("button", { name: "Locations" }),
    ).toBeInTheDocument();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("retains selection across Notes tab remounts, isolates worlds, and handles a removed category", async () => {
    const user = userEvent.setup();
    vi.spyOn(WorldEntriesService, "listenToWorldEntries").mockReturnValue(
      vi.fn(),
    );
    const first = render(<WorldCategoryBrowser {...props} />);
    await user.click(screen.getByRole("button", { name: "Locations" }));
    first.unmount();
    const second = render(<WorldCategoryBrowser {...props} />);
    expect(
      screen.getByRole("heading", { name: "Locations" }),
    ).toBeInTheDocument();
    const other = {
      ...category,
      id: "other-category",
      worldId: "other-world",
      name: "NPCs",
    };
    second.rerender(
      <WorldCategoryBrowser
        {...props}
        worldId={other.worldId}
        categories={[other]}
      />,
    );
    expect(screen.getByRole("button", { name: "NPCs" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "NPCs" }));
    second.rerender(<WorldCategoryBrowser {...props} />);
    expect(
      screen.getByRole("heading", { name: "Locations" }),
    ).toBeInTheDocument();
    second.rerender(<WorldCategoryBrowser {...props} categories={[]} />);
    expect(
      screen.getByText("This world has no categories yet."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Search entries" }),
    ).not.toBeInTheDocument();
  });

  it("keeps add-category visible but disabled while an editor's configuration is unavailable", () => {
    render(
      <WorldCategoryBrowser {...props} permission={WorldPermission.Owner} />,
    );
    expect(screen.getByRole("button", { name: "Add category" })).toBeDisabled();
  });
});
