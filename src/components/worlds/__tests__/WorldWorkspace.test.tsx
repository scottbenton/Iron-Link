import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameWorldView } from "pages/games/characterSheet/components/NotesSection/WorldView/GameWorldView";

import { WorldPermission } from "repositories/shared.types";

import { IWorld } from "services/worlds.service";

import { WorldPanel } from "../WorldPanel";
import { translate } from "../categories/__tests__/fixtures";

const state = vi.hoisted(() => ({
  world: undefined as IWorld | undefined,
  gamePermissions: "guide",
  gameWorldId: "world-a",
  confirm: vi.fn(),
  unlink: vi.fn(),
  closeTabsMatching: vi.fn(),
  worldPermission: "owner" as WorldPermission,
  loading: false,
  error: undefined,
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
  useGameId: () => "game-a",
}));
vi.mock("stores/game.store", () => ({
  GamePermission: { Guide: "guide" },
  useGameStore: (selector: (store: typeof state) => unknown) => selector(state),
}));
vi.mock("stores/notes.store", () => ({
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
vi.mock("../WorldOracleContextProvider", () => ({
  WorldOracleContextProvider: ({ children }: { children: ReactNode }) =>
    children,
}));
vi.mock("../categories/WorldCategoryManager", () => ({
  WorldCategoryManager: ({
    configuring,
    onDone,
    generalSettings,
  }: {
    configuring: boolean;
    onDone: () => void;
    generalSettings: ReactNode;
  }) =>
    configuring ? (
      <>
        <button onClick={onDone}>Done</button>
        {generalSettings}
      </>
    ) : (
      <p>Category folders</p>
    ),
}));

const world: IWorld = {
  id: "world-a",
  name: "Our world",
  description: null,
  settingKey: null,
  configurationCustomized: false,
  createdBy: "owner",
  createdAt: new Date(),
  updatedAt: new Date(),
};
beforeEach(() => {
  vi.clearAllMocks();
  state.world = world;
  state.worldPermission = WorldPermission.Owner;
  state.gamePermissions = "guide";
  state.gameWorldId = "world-a";
  state.worldDeleted = false;
  state.count.mockResolvedValue(0);
});

describe("World workspace", () => {
  it.each(["deleted event", "world switch"])(
    "handles delete completion after %s without stale navigation",
    async (change) => {
      let complete!: () => void;
      state.deleteWorld.mockReturnValue(
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
      );
      const onDeleted = vi.fn();
      const user = userEvent.setup();
      const view = render(
        <WorldPanel worldId="world-a" onWorldDeleted={onDeleted} />,
      );
      await user.click(screen.getByRole("button", { name: "Settings" }));
      await user.click(screen.getByRole("button", { name: "Delete World" }));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(state.deleteWorld).toHaveBeenCalledWith("world-a");
      if (change === "deleted event") {
        state.worldDeleted = true;
        view.rerender(
          <WorldPanel worldId="world-a" onWorldDeleted={onDeleted} />,
        );
      } else {
        state.world = { ...world, id: "world-b" };
        view.rerender(
          <WorldPanel worldId="world-b" onWorldDeleted={onDeleted} />,
        );
      }
      await act(async () => complete());
      if (change === "deleted event") expect(onDeleted).toHaveBeenCalledOnce();
      else expect(onDeleted).not.toHaveBeenCalled();
    },
  );

  it("does not unlink a replacement world after confirming an outdated prompt", async () => {
    let answer!: (result: { confirmed: boolean }) => void;
    state.confirm.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    const user = userEvent.setup();
    const view = render(<GameWorldView worldId="world-a" />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("button", { name: "Unlink World" }));
    state.gameWorldId = "world-b";
    view.rerender(<GameWorldView worldId="world-a" />);
    await act(async () => answer({ confirmed: true }));
    expect(state.unlink).not.toHaveBeenCalled();
    expect(screen.getByText("World Unlinked")).toBeInTheDocument();
  });

  it.each(["guide", "player"])(
    "only exposes connection controls for game %s inside settings",
    async (role) => {
      state.gamePermissions = role;
      state.worldPermission = WorldPermission.Guide;
      const user = userEvent.setup();
      render(<GameWorldView worldId="world-a" />);
      expect(
        screen.queryByRole("button", { name: "Change World" }),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Settings" }));
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
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    },
  );

  it("keeps administration in settings and flushes a name change when Done closes settings", async () => {
    const user = userEvent.setup();
    render(<WorldPanel worldId={world.id} />);
    expect(
      screen.getByRole("heading", { name: world.name }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete World" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    const name = screen.getByRole("textbox", { name: "World Name" });
    await user.clear(name);
    await user.type(name, "New name");
    expect(
      screen.getByRole("button", { name: "Delete World" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Done" }));
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
    render(<WorldPanel worldId={world.id} />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete World" }),
    ).not.toBeInTheDocument();
  });

  it("lets editors rename but not delete", async () => {
    state.worldPermission = WorldPermission.Editor;
    const user = userEvent.setup();
    render(<WorldPanel worldId={world.id} />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(
      screen.getByRole("textbox", { name: "World Name" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete World" }),
    ).not.toBeInTheDocument();
  });

  it("never shows stale world controls and resets settings when the world changes", async () => {
    const user = userEvent.setup();
    const view = render(<WorldPanel worldId={world.id} />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    view.rerender(<WorldPanel worldId="world-b" />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete World" }),
    ).not.toBeInTheDocument();
    state.world = { ...world, id: "world-b", name: "Another world" };
    view.rerender(<WorldPanel worldId="world-b" />);
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Another world" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
