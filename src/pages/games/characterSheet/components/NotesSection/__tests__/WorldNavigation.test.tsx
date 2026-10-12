import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldPanelProps } from "components/worlds/WorldPanel";
import { translate } from "components/worlds/categories/__tests__/fixtures";

import { useNotesStore } from "stores/notes.store";

import type { INoteFolder } from "services/noteFolders.service";

import { WorldItem } from "../FolderView/WorldItem";
import { NoteTabs } from "../NoteTabs/NoteTabs";
import { GameWorldView } from "../WorldView/GameWorldView";

const context = vi.hoisted(() => ({
  worldId: "world-a",
  world: { id: "world-a", name: "Ironlands" },
  gamePermissions: "guide",
  categories: {
    locations: { id: "locations", worldId: "world-a", name: "Locations" },
  },
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (original) => ({
  ...(await original<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/auth.store", () => ({
  useUID: () => "reader",
  useAuthStore: () => ({}),
}));
vi.mock("stores/world.store", () => ({
  useWorldStore: (select: (value: typeof context) => unknown) =>
    select(context),
  useWorldPermission: () => "guide",
}));
vi.mock("stores/worldCategories.store", () => ({
  useWorldCategoriesStore: (select: (value: typeof context) => unknown) =>
    select(context),
}));
vi.mock("stores/game.store", () => ({
  GamePermission: { Guide: "guide" },
  useGameStore: (select: (value: typeof context) => unknown) => select(context),
}));
vi.mock("material-ui-confirm", () => ({ useConfirm: () => vi.fn() }));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game-a",
}));
vi.mock("../hooks/useGameWorld", () => ({
  useGameWorldId: () => context.worldId,
  useShowWorldItem: () => true,
}));
vi.mock("../WorldView/LinkWorldDialog", () => ({
  LinkWorldDialog: () => null,
}));
vi.mock("../FolderView", () => ({
  FolderView: () => null,
  FolderViewToolbar: () => null,
}));
vi.mock("../NoteView", () => ({ NoteView: () => null }));
vi.mock("components/worlds/WorldPanel", () => ({
  WorldPanel: ({ navigation, rootBreadcrumb }: WorldPanelProps) => (
    <>
      <a
        {...navigation.getLinkProps({
          type: "category",
          categoryId: "locations",
        })}
      >
        Open Locations
      </a>
      <a {...navigation.getLinkProps({ type: "settings" })}>Settings</a>
      <a
        {...navigation.getLinkProps({
          type: "category-settings",
          categoryId: "locations",
        })}
      >
        Locations settings
      </a>
      {rootBreadcrumb && <a {...rootBreadcrumb.linkProps}>Notes root</a>}
    </>
  ),
}));

beforeEach(() => {
  useNotesStore.getState().reset();
  useNotesStore.setState({
    folderState: {
      loading: false,
      permissions: {},
      folders: {
        root: {
          id: "root",
          creator: "reader",
          isRootPlayerFolder: true,
        } as INoteFolder,
      },
    },
  });
  context.worldId = "world-a";
  context.world.name = "Ironlands";
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});

describe("World Notes navigation", () => {
  it("opens the pinned world in the active tab, with modifier and middle clicks creating background tabs", async () => {
    const user = userEvent.setup();
    useNotesStore.getState().openItemTab({ type: "folder", id: "root" });
    const original = useNotesStore.getState().openTabId;
    render(
      <MemoryRouter initialEntries={["/games/game-a/c/hero?dice=1"]}>
        <WorldItem />
      </MemoryRouter>,
    );
    const world = screen.getByRole("link", { name: /Ironlands/ });
    await user.click(world);
    expect(useNotesStore.getState().openTabId).toBe(original);
    expect(useNotesStore.getState().noteTabItems[original!]).toEqual({
      type: "world",
      itemId: "world-a",
      worldView: { type: "world" },
    });
    useNotesStore.getState().openItemTab({ type: "folder", id: "root" });
    fireEvent.click(world, { ctrlKey: true });
    expect(useNotesStore.getState().noteTabOrder).toHaveLength(2);
    expect(useNotesStore.getState().openTabId).toBe(original);
    act(() => useNotesStore.getState().closeTabsMatching("world", "world-a"));
    fireEvent(
      world,
      new MouseEvent("auxclick", {
        button: 1,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(useNotesStore.getState().noteTabOrder).toHaveLength(2);
    expect(useNotesStore.getState().openTabId).toBe(original);
  });

  it("replaces category titles and gives settings, category settings and Notes breadcrumbs their own destinations", async () => {
    const user = userEvent.setup();
    useNotesStore.getState().openItemTab({ type: "world", id: "world-a" });
    const original = useNotesStore.getState().openTabId;
    render(
      <MemoryRouter initialEntries={["/games/game-a/c/hero?dice=1"]}>
        <NoteTabs />
      </MemoryRouter>,
    );
    expect(screen.getByRole("tab", { name: "Ironlands" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Open Locations" }));
    expect(screen.getByRole("tab", { name: "Locations" })).toBeInTheDocument();
    expect(useNotesStore.getState().openTabId).toBe(original);
    fireEvent.click(screen.getByRole("link", { name: "Settings" }), {
      metaKey: true,
    });
    expect(
      screen.getByRole("tab", { name: "World settings" }),
    ).toBeInTheDocument();
    expect(useNotesStore.getState().openTabId).toBe(original);
    fireEvent(
      screen.getByRole("link", { name: "Locations settings" }),
      new MouseEvent("auxclick", {
        button: 1,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(
      screen.getByRole("tab", { name: "Locations settings" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notes root" })).toHaveAttribute(
      "href",
      "/games/game-a/c/hero?dice=1&note-type=folder&note-id=root",
    );
    await user.click(screen.getByRole("link", { name: "Notes root" }));
    expect(useNotesStore.getState().noteTabItems[original!]).toEqual({
      type: "folder",
      itemId: "root",
    });
  });

  it("rejects a deep destination for a world no longer linked to this game", () => {
    context.worldId = "replacement";
    render(
      <MemoryRouter>
        <GameWorldView
          worldId="world-a"
          worldView={{ type: "category", categoryId: "locations" }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("World Unlinked")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open Locations" }),
    ).not.toBeInTheDocument();
  });
});
