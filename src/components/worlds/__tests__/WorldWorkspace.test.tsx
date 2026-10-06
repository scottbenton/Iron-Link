import { screen, render as testingRender } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode, useState } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BreadcrumbItem } from "components/Layout/BreadcrumbTrail";
import type { WorldLayout } from "components/worlds/WorldViewLayout";
import type {
  WorldNavigation,
  WorldView,
} from "components/worlds/worldNavigation";

import { GameWorldView } from "pages/games/characterSheet/components/NotesSection/WorldView/GameWorldView";

import { WorldPermission } from "repositories/shared.types";

import type { IWorldCategory } from "services/worldCategories.service";
import { IWorld } from "services/worlds.service";

import type { WorldPanelProps } from "../WorldPanel";
import { WorldPanel } from "../WorldPanel";
import { category as sampleCategory } from "../categories/__tests__/fixtures";
import { translate } from "../categories/__tests__/fixtures";

const state = vi.hoisted(() => ({
  worldId: "world-a",
  world: undefined as IWorld | undefined,
  gamePermissions: "guide",
  gameWorldId: "world-a",
  gameId: "game-a",
  confirm: vi.fn(),
  unlink: vi.fn(),
  closeTabsMatching: vi.fn(),
  openItemTab: vi.fn(),
  folderState: { folders: {} },
  categories: {} as Record<string, IWorldCategory>,
  rootFolderId: undefined as string | undefined,
  worldPermission: "owner" as WorldPermission,
  loading: false,
  error: undefined as string | undefined,
  worldDeleted: false,
  updateWorldName: vi.fn().mockResolvedValue(undefined),
  deleteWorld: vi.fn(),
  count: vi.fn(),
}));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/world.store", () => ({
  useListenToWorld: vi.fn(),
  useWorldStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock("services/worlds.service", () => ({
  WorldsService: {
    unlinkGameFromWorld: state.unlink,
    countGamesLinkedToWorld: state.count,
  },
}));
vi.mock("material-ui-confirm", () => ({ useConfirm: () => state.confirm }));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => state.gameId,
}));
vi.mock("stores/game.store", () => ({
  GamePermission: { Guide: "guide" },
  useGameStore: (selector: (store: typeof state) => unknown) => selector(state),
}));
vi.mock("stores/auth.store", () => ({ useUID: () => "reader" }));
vi.mock("stores/worldCategories.store", () => ({
  useListenToWorldConfiguration: vi.fn(),
  useWorldCategoriesStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock("stores/worldOracles.store", () => ({
  useListenToWorldOracles: vi.fn(),
}));
vi.mock("stores/notes.store", () => ({
  getPlayerNotesFolder: () =>
    state.rootFolderId ? { id: state.rootFolderId } : undefined,
  useNotesStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock(
  "pages/games/characterSheet/components/NotesSection/hooks/useGameWorld",
  () => ({ useGameWorldId: () => state.gameWorldId }),
);
vi.mock(
  "pages/games/characterSheet/components/NotesSection/WorldView/LinkWorldDialog",
  () => ({ LinkWorldDialog: () => null }),
);
vi.mock("../categories/WorldCategoryManager", async () => {
  const { WorldBreadcrumbs } = await import("../WorldBreadcrumbs");
  const { WorldViewLayout } = await import("../WorldViewLayout");
  return {
    // Keeps the real chrome (breadcrumbs, title, settings link) while
    // replacing the category browser and configuration surfaces.
    WorldCategoryManager: ({
      world,
      navigation,
      layout,
      rootBreadcrumb,
      generalSettings,
    }: {
      world: IWorld;
      navigation: WorldNavigation;
      layout: WorldLayout;
      rootBreadcrumb: BreadcrumbItem;
      generalSettings: ReactNode;
    }) => {
      const view = navigation.view;
      const category =
        "categoryId" in view ? state.categories[view.categoryId] : undefined;
      return (
        <WorldViewLayout
          layout={layout}
          title={world.name}
          breadcrumbs={
            <WorldBreadcrumbs
              world={world}
              category={category}
              navigation={navigation}
              root={rootBreadcrumb}
            />
          }
          actions={
            view.type === "world"
              ? {
                  start: (
                    <a {...navigation.getLinkProps({ type: "settings" })}>
                      World settings
                    </a>
                  ),
                }
              : undefined
          }
        >
          {view.type === "settings" ? generalSettings : <p>Category folders</p>}
        </WorldViewLayout>
      );
    },
  };
});

const render = (element: ReactNode) =>
  testingRender(element, { wrapper: MemoryRouter });

function TestWorldPanel(props: Omit<WorldPanelProps, "navigation">) {
  const [selection, setSelection] = useState<{
    worldId: string;
    view: WorldView;
  }>({ worldId: props.worldId, view: { type: "world" } });
  const view: WorldView =
    selection.worldId === props.worldId ? selection.view : { type: "world" };
  const setView = (next: WorldView) =>
    setSelection({ worldId: props.worldId, view: next });
  return (
    <WorldPanel
      {...props}
      navigation={{
        view,
        navigate: setView,
        getLinkProps: (destination) => ({
          href: "#world",
          onClick: (event) => {
            event.preventDefault();
            setView(destination);
          },
        }),
      }}
    />
  );
}

const world: IWorld = {
  id: "world-a",
  name: "Our world",
  description: null,
  settingKey: null,
  createdBy: "owner",
  createdAt: new Date(),
  updatedAt: new Date(),
};
beforeEach(() => {
  vi.clearAllMocks();
  state.world = world;
  state.worldId = world.id;
  state.error = undefined;
  state.worldPermission = WorldPermission.Owner;
  state.gamePermissions = "guide";
  state.gameWorldId = "world-a";
  state.gameId = "game-a";
  state.worldDeleted = false;
  state.rootFolderId = undefined;
  state.categories = {};
  state.count.mockResolvedValue(0);
});

describe("World workspace", () => {
  it.each(["deleted", "error"])(
    "shows loading instead of an old world's %s state while switching routes",
    (stale) => {
      const view = render(<TestWorldPanel worldId="world-a" />);
      state.worldDeleted = stale === "deleted";
      state.error = stale === "error" ? "Old world error" : undefined;
      view.rerender(<TestWorldPanel worldId="world-b" />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.queryByText("World Deleted")).not.toBeInTheDocument();
      expect(screen.queryByText("Old world error")).not.toBeInTheDocument();
      state.worldId = "world-b";
      state.world = { ...world, id: "world-b", name: "New world" };
      state.worldDeleted = false;
      state.error = undefined;
      view.rerender(<TestWorldPanel worldId="world-b" />);
      expect(
        screen.getByRole("heading", { name: "New world" }),
      ).toBeInTheDocument();
    },
  );

  it("renders the actual shared Notes → world → category breadcrumb with same-game destination links", async () => {
    state.rootFolderId = "reader-notes";
    state.categories = {
      locations: { ...sampleCategory, id: "locations", worldId: "world-a" },
    };
    const user = userEvent.setup();
    render(
      <GameWorldView
        worldId="world-a"
        worldView={{ type: "category", categoryId: "locations" }}
      />,
    );
    const trail = screen.getByRole("navigation", { name: "Breadcrumbs" });
    expect(trail).toHaveTextContent("Notes");
    expect(trail).toHaveTextContent("Our world");
    expect(trail).toHaveTextContent("Locations");
    expect(
      screen.queryByRole("link", { name: "Worlds" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notes" })).toHaveAttribute(
      "href",
      "/?note-type=folder&note-id=reader-notes",
    );
    expect(screen.getByRole("link", { name: "Our world" })).toHaveAttribute(
      "href",
      "/?note-type=world&note-id=world-a",
    );
    await user.click(screen.getByRole("link", { name: "Notes" }));
    expect(state.openItemTab).toHaveBeenCalledWith({
      type: "folder",
      id: "reader-notes",
      replaceCurrent: true,
      openInBackground: false,
    });
  });

  it.each(["guide", "player"])(
    "only exposes connection controls for game %s inside settings",
    async (role) => {
      state.gamePermissions = role;
      state.worldPermission = WorldPermission.Guide;
      const user = userEvent.setup();
      const view = render(<GameWorldView worldId="world-a" />);
      expect(
        screen.queryByRole("button", { name: "Change World" }),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("link", { name: "World settings" }));
      view.rerender(
        <GameWorldView worldId="world-a" worldView={{ type: "settings" }} />,
      );
      if (role === "guide") {
        expect(
          screen.getByRole("button", { name: "Change World" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Unlink World" }),
        ).toBeInTheDocument();
      } else {
        expect(
          screen.queryByRole("button", { name: "Change World" }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "Unlink World" }),
        ).not.toBeInTheDocument();
      }
      expect(
        screen.queryByRole("button", { name: "Delete World" }),
      ).not.toBeInTheDocument();
      for (const textbox of screen.queryAllByRole("textbox"))
        expect(textbox).toBeDisabled();
    },
  );

  it("keeps administration in settings and flushes a name change when the world breadcrumb returns to browsing", async () => {
    const user = userEvent.setup();
    render(<TestWorldPanel worldId={world.id} />);
    expect(
      screen.getByRole("heading", { name: world.name }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete World" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "World settings" }));
    const name = screen.getByRole("textbox", { name: "World Name" });
    await user.clear(name);
    await user.type(name, "New name");
    expect(
      screen.getByRole("button", { name: "Delete World" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: world.name }));
    expect(state.updateWorldName).toHaveBeenCalledWith(world.id, "New name");
    expect(screen.getByText("Category folders")).toBeInTheDocument();
  });

  it.each([
    WorldPermission.Guide,
    WorldPermission.Player,
    WorldPermission.Viewer,
    WorldPermission.None,
  ])("keeps general settings read only for %s", async (permission) => {
    state.worldPermission = permission;
    const user = userEvent.setup();
    render(<TestWorldPanel worldId={world.id} />);
    await user.click(screen.getByRole("link", { name: "World settings" }));
    expect(screen.getByRole("textbox", { name: "World Name" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Delete World" }),
    ).not.toBeInTheDocument();
  });

  it("lets editors rename but not delete", async () => {
    state.worldPermission = WorldPermission.Editor;
    const user = userEvent.setup();
    render(<TestWorldPanel worldId={world.id} />);
    await user.click(screen.getByRole("link", { name: "World settings" }));
    expect(
      screen.getByRole("textbox", { name: "World Name" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete World" }),
    ).not.toBeInTheDocument();
  });

  it("never shows stale world controls and resets settings when the world changes", async () => {
    const user = userEvent.setup();
    const view = render(<TestWorldPanel worldId={world.id} />);
    await user.click(screen.getByRole("link", { name: "World settings" }));
    view.rerender(<TestWorldPanel worldId="world-b" />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete World" }),
    ).not.toBeInTheDocument();
    state.world = { ...world, id: "world-b", name: "Another world" };
    state.worldId = "world-b";
    view.rerender(<TestWorldPanel worldId="world-b" />);
    expect(
      screen.getByRole("link", { name: "World settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Another world" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
