import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { translate } from "components/worlds/categories/__tests__/fixtures";

import { Toolbar } from "ui/components/Toolbar";

import { useNotesStore } from "stores/notes.store";

import { GameType } from "repositories/game.repository";
import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import type { INoteFolder } from "services/noteFolders.service";
import type { INote } from "services/notes.service";

import { FolderView } from "../FolderView/FolderView";
import { FolderViewToolbar } from "../FolderView/FolderViewToolbar";
import { MoveDialog } from "../MoveDialog";
import { useNoteItemActions } from "../NoteItemActions";
import { NoteActionsMenu } from "../NoteView/NoteActionsMenu";

const confirm = vi.hoisted(() => vi.fn());
const game = vi.hoisted(() => ({ gameType: "guided" as string }));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
// Loaded through the notes store; jsdom cannot load audio.
vi.mock("lib/audio.lib", () => ({}));
vi.mock("react-i18next", async (original) => ({
  ...(await original<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/auth.store", () => ({ useUID: () => "reader" }));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game-a",
}));
vi.mock("pages/games/gamePageLayout/hooks/usePermissions", () => ({
  useGamePermissions: () => ({
    gameType: game.gameType,
    gamePermission: "player",
  }),
}));
vi.mock("ui/components/ConfirmDialog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ui/components/ConfirmDialog")>()),
  useConfirm: () => confirm,
}));
vi.mock("../hooks/useGameWorld", () => ({
  useGameWorldId: () => undefined,
  useShowWorldItem: () => false,
}));

const allowed = { canEdit: true, canDelete: true, canChangePermissions: true };
const denied = {
  canEdit: false,
  canDelete: false,
  canChangePermissions: false,
};

const folder = (id: string, overrides: Partial<INoteFolder> = {}) =>
  ({
    id,
    gameId: "game-a",
    name: id,
    order: 1,
    creator: "reader",
    parentFolderId: "root",
    isRootPlayerFolder: false,
    readPermissions: ReadPermissions.OnlyAuthor,
    editPermissions: EditPermissions.OnlyAuthor,
    ...overrides,
  }) as INoteFolder;

const note = (title: string, order: number, overrides: Partial<INote> = {}) =>
  ({
    title,
    order,
    creator: "reader",
    parentFolderId: "root",
    readPermissions: ReadPermissions.OnlyAuthor,
    editPermissions: EditPermissions.OnlyAuthor,
    ...overrides,
  }) as INote;

function seed(
  permissions: typeof allowed = allowed,
  extraFolders: Record<string, INoteFolder> = {},
) {
  useNotesStore.setState((store) => {
    store.folderState = {
      loading: false,
      error: undefined,
      folders: {
        root: folder("root", {
          name: undefined,
          parentFolderId: null,
          isRootPlayerFolder: true,
        }),
        zeta: folder("zeta", { name: "Zeta" }),
        alpha: folder("alpha", {
          name: "Alpha",
          readPermissions: ReadPermissions.AllPlayers,
        }),
        ...extraFolders,
      },
      permissions: {
        root: permissions,
        zeta: permissions,
        alpha: permissions,
      },
    };
    store.noteState = {
      loading: false,
      error: undefined,
      notes: {
        second: note("Second", 2),
        first: note("First", 1),
      },
      permissions: { second: permissions, first: permissions },
    };
  });
  useNotesStore.getState().openItemTab({ type: "folder", id: "root" });
}

// The note toolbar's actions, as NoteToolbars wires them.
function NoteActions(props: { noteId: string }) {
  const { actions, dialogs } = useNoteItemActions({
    type: "note",
    id: props.noteId,
  });
  return (
    <>
      <Toolbar aria-label="Note">
        <NoteActionsMenu actions={actions} />
      </Toolbar>
      {dialogs}
    </>
  );
}

const renderInRouter = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  useNotesStore.getState().reset();
  game.gameType = GameType.Guided;
  confirm.mockReset();
});

describe("Notes folder view", () => {
  it("lists sub-folders by name, then notes in their order, and opens each in the current tab", async () => {
    const user = userEvent.setup();
    seed();
    renderInRouter(<FolderView folderId="root" />);

    const titles = screen
      .getAllByText(/^(Alpha|Zeta|First|Second)$/)
      .map((element) => element.textContent);
    expect(titles).toEqual(["Alpha", "Zeta", "First", "Second"]);

    const tab = useNotesStore.getState().openTabId!;
    await user.click(screen.getByText("Alpha"));
    expect(useNotesStore.getState().noteTabItems[tab]).toEqual({
      type: "folder",
      itemId: "alpha",
    });
    await user.click(screen.getByText("First"));
    expect(useNotesStore.getState().noteTabItems[tab]).toEqual({
      type: "note",
      itemId: "first",
    });
    expect(useNotesStore.getState().noteTabOrder).toHaveLength(1);
  });

  it("opens folders and notes in a background tab on a modifier or middle click", () => {
    seed();
    renderInRouter(<FolderView folderId="root" />);
    const tab = useNotesStore.getState().openTabId;

    fireEvent.click(screen.getByText("Zeta"), { ctrlKey: true });
    fireEvent(
      screen.getByText("Second"),
      new MouseEvent("auxclick", {
        button: 1,
        bubbles: true,
        cancelable: true,
      }),
    );

    const state = useNotesStore.getState();
    expect(state.openTabId).toBe(tab);
    expect(state.noteTabOrder.map((id) => state.noteTabItems[id])).toEqual([
      { type: "folder", itemId: "root" },
      { type: "folder", itemId: "zeta" },
      { type: "note", itemId: "second" },
    ]);
  });

  it("says when a folder is empty", () => {
    seed();
    renderInRouter(<FolderView folderId="zeta" />);
    expect(screen.getByText("Empty Folder")).toBeInTheDocument();
    expect(
      screen.getByText("This folder has no contents yet."),
    ).toBeInTheDocument();
  });

  it("lists items whose folder this person cannot see under Shared with you", () => {
    seed(allowed, {
      orphan: folder("orphan", { name: "Orphan", parentFolderId: "hidden" }),
    });
    useNotesStore.setState((store) => {
      store.noteState.notes.lost = note("Lost", 1, {
        parentFolderId: "hidden",
      });
    });
    renderInRouter(<FolderView folderId={undefined} />);
    expect(
      screen.getByRole("heading", { name: "Shared with you" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Orphan")).toBeInTheDocument();
    expect(screen.getByText("Lost")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("offers a drag handle for each note only to people who can edit the folder", () => {
    seed();
    const { unmount } = renderInRouter(<FolderView folderId="root" />);
    expect(
      screen.getByRole("button", { name: "Move First" }),
    ).toBeInTheDocument();
    unmount();

    seed(denied);
    renderInRouter(<FolderView folderId="root" />);
    expect(
      screen.queryByRole("button", { name: "Move First" }),
    ).not.toBeInTheDocument();
  });

  it("offers folder and note actions by permission, and no menu without any", async () => {
    const user = userEvent.setup();
    seed();
    const { unmount } = renderInRouter(<FolderView folderId="root" />);

    await user.click(screen.getByRole("button", { name: "Alpha actions" }));
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual([
      "Rename Folder",
      "Share Folder",
      "Move Folder",
      "Delete Folder",
    ]);
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "First actions" }));
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Rename Note", "Share Note", "Move Note", "Delete Note"]);
    await user.keyboard("{Escape}");
    unmount();

    game.gameType = GameType.Solo;
    seed({ canEdit: true, canDelete: false, canChangePermissions: false });
    const solo = renderInRouter(<FolderView folderId="root" />);
    await user.click(screen.getByRole("button", { name: "Alpha actions" }));
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Rename Folder"]);
    await user.keyboard("{Escape}");
    solo.unmount();

    seed(denied);
    renderInRouter(<FolderView folderId="root" />);
    expect(
      screen.queryByRole("button", { name: "Alpha actions" }),
    ).not.toBeInTheDocument();
  });

  it("asks before deleting a note, and deletes it once confirmed", async () => {
    const user = userEvent.setup();
    seed();
    const deleteNote = vi.fn().mockResolvedValue(undefined);
    useNotesStore.setState({ deleteNote });
    confirm.mockResolvedValue({ confirmed: true });
    renderInRouter(<FolderView folderId="root" />);

    await user.click(screen.getByRole("button", { name: "First actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete Note" }));
    expect(confirm.mock.calls[0][0].title).toBe("Delete First");
    expect(deleteNote).toHaveBeenCalledWith("first");
  });

  it("renames a note from its menu", async () => {
    const user = userEvent.setup();
    seed();
    const updateNoteName = vi.fn().mockResolvedValue(undefined);
    useNotesStore.setState({ updateNoteName });
    renderInRouter(<FolderView folderId="root" />);

    await user.click(screen.getByRole("button", { name: "First actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Rename Note" }));
    const dialog = screen.getByRole("dialog", { name: "Note Name" });
    const input = within(dialog).getByRole("textbox", { name: /Name/ });
    expect(input).toHaveValue("First");
    await user.clear(input);
    await user.type(input, "Opening");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(updateNoteName).toHaveBeenCalledWith("first", "Opening");
  });
});

describe("Notes folder toolbar", () => {
  it("offers folder actions for a sub-folder, and only creation in the root folder", () => {
    seed();
    const { unmount } = renderInRouter(<FolderViewToolbar folderId="alpha" />);
    for (const name of [
      "Rename Folder",
      "Move Folder",
      "Share Folder",
      "Delete Folder",
      "Create Folder",
      "Create Note",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    unmount();

    renderInRouter(<FolderViewToolbar folderId="root" />);
    expect(
      screen.queryByRole("button", { name: "Rename Folder" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Folder" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Folder" }),
    ).toBeInTheDocument();
  });

  it("offers nothing to people who cannot edit the folder", () => {
    seed(denied);
    renderInRouter(<FolderViewToolbar folderId="alpha" />);
    expect(
      screen.queryByRole("button", { name: "Create Note" }),
    ).not.toBeInTheDocument();
  });

  it("creates a note after the folder's last note, and refuses a blank name", async () => {
    const user = userEvent.setup();
    seed();
    const createNote = vi.fn().mockResolvedValue("new");
    useNotesStore.setState({ createNote });
    renderInRouter(<FolderViewToolbar folderId="root" />);

    await user.click(screen.getByRole("button", { name: "Create Note" }));
    const dialog = screen.getByRole("dialog", { name: "Note Name" });
    const input = within(dialog).getByRole("textbox", { name: /Name/ });
    await user.type(input, "   ");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(createNote).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, "Session one{Enter}");
    expect(createNote).toHaveBeenCalledWith(
      "game-a",
      "reader",
      "root",
      "Session one",
      3,
    );
  });

  it("creates a folder with its parent's permissions", async () => {
    const user = userEvent.setup();
    seed();
    const createFolder = vi.fn().mockResolvedValue("new");
    useNotesStore.setState({ createFolder });
    renderInRouter(<FolderViewToolbar folderId="alpha" />);

    await user.click(screen.getByRole("button", { name: "Create Folder" }));
    const dialog = screen.getByRole("dialog", { name: "Folder Name" });
    await user.type(
      within(dialog).getByRole("textbox", { name: /Name/ }),
      "Places",
    );
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(createFolder).toHaveBeenCalledWith(
      "reader",
      "game-a",
      "alpha",
      "Places",
      1,
      ReadPermissions.AllPlayers,
      EditPermissions.OnlyAuthor,
    );
  });
});

describe("Move dialog", () => {
  it("lists the folders this person can edit, never the folder itself, and moves into the chosen one", async () => {
    const user = userEvent.setup();
    seed(allowed, {
      guides: folder("guides", {
        name: "Guide only",
        editPermissions: EditPermissions.OnlyGuides,
      }),
    });
    const moveFolder = vi.fn().mockResolvedValue(undefined);
    useNotesStore.setState({ moveFolder });
    const onClose = vi.fn();
    render(
      <MoveDialog
        open
        onClose={onClose}
        item={{ type: "folder", id: "zeta", parentFolderId: "root" }}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Move Folder" });
    const root = within(dialog).getByRole("treeitem", { name: /Notes/ });
    root.focus();
    await user.keyboard("{ArrowRight}");
    expect(
      within(dialog).queryByRole("treeitem", { name: /Guide only/ }),
    ).not.toBeInTheDocument();
    const self = within(dialog).getByRole("treeitem", { name: "Zeta" });
    expect(self).toHaveAttribute("aria-disabled", "true");

    await user.click(within(dialog).getByText("Alpha"));
    // Alpha is shared with all players, so moving can bring the folder's
    // permissions along.
    await user.click(
      within(dialog).getByRole("checkbox", {
        name: "Update permissions to match the new folder",
      }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(moveFolder).toHaveBeenCalledWith("zeta", "alpha", true);
  });
});

describe("Note toolbar actions", () => {
  it("offers the open note's actions, and deleting it returns the tab to its folder", async () => {
    const user = userEvent.setup();
    seed();
    const deleteNote = vi.fn().mockResolvedValue(undefined);
    useNotesStore.setState({ deleteNote });
    useNotesStore.getState().openItemTab({ type: "note", id: "first" });
    const tab = useNotesStore.getState().openTabId!;
    confirm.mockResolvedValue({ confirmed: true });
    renderInRouter(<NoteActions noteId="first" />);

    await user.click(screen.getByRole("button", { name: "Note actions" }));
    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual([
      "Rename Note",
      "Share Note",
      "Move Note",
      "Delete Note",
    ]);
    await user.click(screen.getByRole("menuitem", { name: "Delete Note" }));
    expect(confirm.mock.calls[0][0].title).toBe("Delete First");
    expect(deleteNote).toHaveBeenCalledWith("first");
    expect(useNotesStore.getState().noteTabItems[tab]).toEqual({
      type: "folder",
      itemId: "root",
    });
  });
});
