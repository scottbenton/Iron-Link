import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldPanelProps } from "components/worlds/WorldPanel";
import { translate } from "components/worlds/categories/__tests__/fixtures";

import { useNotesStore } from "stores/notes.store";

import type { INoteFolder } from "services/noteFolders.service";

import { GameWorldSection } from "../FolderView/GameWorldSection";
import { NoteTabs } from "../NoteTabs/NoteTabs";
import { GameWorldView } from "../WorldView/GameWorldView";

const confirm = vi.hoisted(() => vi.fn());
const context = vi.hoisted(() => ({
  worldId: "world-a",
  worldsEnabled: true,
  noteViewThrows: false,
  world: { id: "world-a", name: "Ironlands" },
  worldPermission: "guide" as string | null,
  worldDeleted: false,
  gamePermissions: "guide",
  loading: false,
  categories: {
    locations: {
      id: "locations",
      worldId: "world-a",
      name: "Locations",
      sortOrder: 1,
    },
    npcs: { id: "npcs", worldId: "world-a", name: "NPCs", sortOrder: 0 },
  } as Record<string, unknown>,
  entryState: {
    loading: false,
    entries: {
      a: { id: "a", categoryId: "npcs" },
      b: { id: "b", categoryId: "npcs" },
      c: { id: "c", categoryId: "locations" },
    },
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
  useWorldPermission: () => context.worldPermission,
}));
vi.mock("stores/worldEntries.store", () => ({
  useWorldEntriesStore: (select: (value: typeof context) => unknown) =>
    select(context),
}));
vi.mock("stores/worldCategories.store", () => ({
  useWorldCategoriesStore: (select: (value: typeof context) => unknown) =>
    select(context),
}));
vi.mock("stores/game.store", () => ({
  GamePermission: { Guide: "guide" },
  useGameStore: (select: (value: typeof context) => unknown) => select(context),
}));
vi.mock("hooks/advancedFeatures/advancedFeatures", () => ({
  useAdvancedFeatureToggle: () => context.worldsEnabled,
}));
vi.mock("material-ui-confirm", () => ({ useConfirm: () => confirm }));
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
vi.mock("../NoteView", () => ({
  NoteView: () => {
    if (context.noteViewThrows) throw new Error("Note crashed");
    return null;
  },
}));
vi.mock("components/worlds/WorldPanel", () => ({
  WorldPanel: ({
    navigation,
    rootBreadcrumb,
    additionalSettings,
  }: WorldPanelProps) => (
    <>
      {additionalSettings}
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
  context.worldsEnabled = true;
  context.noteViewThrows = false;
  context.world.name = "Ironlands";
  context.worldPermission = "guide";
  context.loading = false;
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});

describe("World Notes navigation", () => {
  it("lists the world's categories in order with their entry counts", () => {
    render(
      <MemoryRouter initialEntries={["/games/game-a/c/hero"]}>
        <GameWorldSection />
      </MemoryRouter>,
    );
    const section = screen.getByRole("region", { name: "Ironlands" });
    const links = within(section).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Ironlands",
      "",
      "NPCs2 entries",
      "Locations1 entry",
    ]);
    expect(screen.getByRole("link", { name: /Locations/ })).toHaveAttribute(
      "href",
      "/games/game-a/c/hero?note-type=world&note-id=world-a&note-world-view=category&note-category-id=locations",
    );
  });

  it("opens world settings from the cog in a new tab, and hides the cog from players", async () => {
    const user = userEvent.setup();
    useNotesStore.getState().openItemTab({ type: "folder", id: "root" });
    const root = useNotesStore.getState().openTabId;
    const { unmount } = render(
      <MemoryRouter>
        <GameWorldSection />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("link", { name: "World settings" }));
    const state = useNotesStore.getState();
    expect(state.noteTabOrder).toHaveLength(2);
    expect(state.openTabId).not.toBe(root);
    expect(state.noteTabItems[root!]).toEqual({
      type: "folder",
      itemId: "root",
    });
    expect(state.noteTabItems[state.openTabId!]).toEqual({
      type: "world",
      itemId: "world-a",
      worldView: { type: "settings" },
    });
    unmount();

    context.worldPermission = "player";
    render(
      <MemoryRouter>
        <GameWorldSection />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("link", { name: "World settings" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /NPCs/ })).toBeInTheDocument();
  });

  it("shows progress while the categories load", () => {
    context.loading = true;
    render(
      <MemoryRouter>
        <GameWorldSection />
      </MemoryRouter>,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /NPCs/ }),
    ).not.toBeInTheDocument();
  });

  it("opens the world home in the active tab, with modifier and middle clicks creating background tabs", async () => {
    const user = userEvent.setup();
    useNotesStore.getState().openItemTab({ type: "folder", id: "root" });
    const original = useNotesStore.getState().openTabId;
    render(
      <MemoryRouter initialEntries={["/games/game-a/c/hero?dice=1"]}>
        <GameWorldSection />
      </MemoryRouter>,
    );
    const world = screen.getByRole("link", { name: "Ironlands" });
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

  // Release guard until #236 previews oracle changes.
  it("warns that world fields may roll different oracles before unlinking", async () => {
    const user = userEvent.setup();
    confirm.mockResolvedValue({ confirmed: false });
    render(
      <MemoryRouter>
        <GameWorldView worldId="world-a" worldView={{ type: "settings" }} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Unlink World" }));
    const { description } = confirm.mock.calls[0][0];
    render(description);
    expect(
      screen.getByText("Some world fields may roll different oracles."),
    ).toBeInTheDocument();
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

  it("says worlds are off when a link opens a world tab without them", () => {
    context.worldsEnabled = false;
    render(
      <MemoryRouter>
        <GameWorldView worldId="world-a" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Worlds are turned off")).toBeInTheDocument();
  });

  it("explains a folder tab this person cannot read", () => {
    useNotesStore.getState().openItemTab({ type: "folder", id: "hidden" });
    render(
      <MemoryRouter>
        <NoteTabs />
      </MemoryRouter>,
    );
    expect(screen.getByText("Folder unavailable")).toBeInTheDocument();
  });

  it("keeps the tab strip when one tab crashes", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    context.noteViewThrows = true;
    useNotesStore.getState().openItemTab({ type: "note", id: "broken" });
    render(
      <MemoryRouter>
        <NoteTabs />
      </MemoryRouter>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getAllByRole("tab").length).toBeGreaterThan(0);
  });
});
