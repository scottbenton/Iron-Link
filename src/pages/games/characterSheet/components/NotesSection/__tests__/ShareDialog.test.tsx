import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { translate } from "components/worlds/categories/__tests__/fixtures";

import { useNotesStore } from "stores/notes.store";

import { GameType } from "repositories/game.repository";
import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import type { INoteFolder } from "services/noteFolders.service";

import { ShareDialog } from "../ShareDialog";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
// Loaded through the notes store; jsdom cannot load audio.
vi.mock("lib/audio.lib", () => ({}));
vi.mock("react-i18next", async (original) => ({
  ...(await original<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/auth.store", () => ({ useUID: () => "author" }));
vi.mock("pages/games/gamePageLayout/hooks/usePermissions", () => ({
  useGamePermissions: () => ({ gameType: GameType.Guided }),
}));

const folder = (overrides: Partial<INoteFolder>) =>
  ({
    id: "folder",
    name: "Folder",
    creator: "author",
    parentFolderId: "root",
    isRootPlayerFolder: false,
    readPermissions: ReadPermissions.AllPlayers,
    editPermissions: EditPermissions.OnlyAuthor,
    ...overrides,
  }) as INoteFolder;

function renderDialog(
  readPermissions: ReadPermissions,
  editPermissions: EditPermissions,
) {
  useNotesStore.setState((store) => {
    store.folderState.folders = {
      root: folder({ id: "root", name: "Guide", parentFolderId: null }),
      folder: folder({ readPermissions, editPermissions }),
    };
  });
  render(
    <ShareDialog
      open
      onClose={vi.fn()}
      item={{ type: "folder", id: "folder" }}
    />,
  );
}

const group = (name: string) => screen.getByRole("radiogroup", { name });
const disabledEditOptions = () =>
  within(group("Who can edit?"))
    .getAllByRole("radio")
    .filter((radio) => (radio as HTMLInputElement).disabled)
    .map((radio) => radio.closest("label")?.textContent);

beforeEach(() => {
  useNotesStore.getState().reset();
});

describe("ShareDialog", () => {
  it("keeps editing by the author and Guides available in a Guide folder", () => {
    renderDialog(ReadPermissions.OnlyGuides, EditPermissions.OnlyGuides);
    expect(disabledEditOptions()).toEqual(["All Players"]);
  });

  it("limits editing to the readers each view setting names", async () => {
    const user = userEvent.setup();
    renderDialog(ReadPermissions.AllPlayers, EditPermissions.AllPlayers);
    expect(disabledEditOptions()).toEqual([]);

    await user.click(
      within(group("Who can view?")).getByRole("radio", {
        name: "You and the Guide(s)",
      }),
    );
    expect(disabledEditOptions()).toEqual(["All Players"]);
    expect(
      within(group("Who can edit?")).getByRole("radio", { name: "Only You" }),
    ).toBeChecked();

    await user.click(
      within(group("Who can view?")).getByRole("radio", { name: "Only You" }),
    );
    expect(disabledEditOptions()).toEqual([
      "You and the Guide(s)",
      "All Players",
    ]);
  });
});
