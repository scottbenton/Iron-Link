import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorldStore } from "stores/world.store";

import {
  EditPermissions,
  ReadPermissions,
  WorldPermission,
} from "repositories/shared.types";

import { WorldEntriesService } from "services/worldEntries.service";

import { translate } from "../../categories/__tests__/fixtures";
import { WorldEntryShareDialog } from "../WorldEntryShareDialog";
import { worldEntry } from "./fixtures";

const auth = vi.hoisted(() => ({ uid: "author" }));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => auth.uid }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

const group = (name: string) => screen.getByRole("radiogroup", { name });
const optionNames = (name: string) =>
  within(group(name))
    .getAllByRole("radio")
    .map((radio) => radio.closest("label")?.textContent);
const disabledNames = (name: string) =>
  within(group(name))
    .getAllByRole("radio")
    .filter((radio) => (radio as HTMLInputElement).disabled)
    .map((radio) => radio.closest("label")?.textContent);

function renderDialog(
  uid: string,
  permission: WorldPermission,
  entry = worldEntry(),
) {
  auth.uid = uid;
  useWorldStore.setState({ worldPermission: permission });
  const onClose = vi.fn();
  render(<WorldEntryShareDialog entry={entry} onClose={onClose} />);
  return onClose;
}

describe("WorldEntryShareDialog", () => {
  it("offers a player author every audience that keeps them in", () => {
    renderDialog("author", WorldPermission.Player);
    expect(optionNames("Who can view?")).toEqual([
      "Only you",
      "Guides and you",
      "All players",
    ]);
    expect(optionNames("Who can edit?")).toEqual([
      "Only you",
      "Guides and you",
      "All players",
    ]);
    expect(
      within(group("Who can view?")).getByRole("radio", {
        name: "All players",
      }),
    ).toBeChecked();
    expect(
      within(group("Who can edit?")).getByRole("radio", {
        name: "Guides and you",
      }),
    ).toBeChecked();
  });

  it("offers a Guide who is not the author the world's audiences without author-only access", () => {
    renderDialog("guide", WorldPermission.Guide);
    expect(optionNames("Who can view?")).toEqual([
      "Guides and the author",
      "Guides only",
      "All players",
    ]);
    expect(optionNames("Who can edit?")).toEqual([
      "Guides and the author",
      "Guides only",
      "All players",
    ]);
  });

  it("never lets edit access reach past who can view, and saves both", async () => {
    const user = userEvent.setup();
    const update = vi
      .spyOn(WorldEntriesService, "updateWorldEntry")
      .mockResolvedValue();
    const onClose = renderDialog(
      "author",
      WorldPermission.Owner,
      worldEntry({ editPermissions: EditPermissions.AllPlayers }),
    );
    const view = group("Who can view?");
    const edit = group("Who can edit?");
    expect(disabledNames("Who can edit?")).toEqual([]);

    await user.click(within(view).getByRole("radio", { name: "Guides only" }));
    expect(disabledNames("Who can edit?")).toEqual([
      "Only you",
      "Guides and you",
      "All players",
    ]);
    expect(
      within(edit).getByRole("radio", { name: "Guides only" }),
    ).toBeChecked();

    await user.click(
      within(view).getByRole("radio", { name: "Guides and you" }),
    );
    expect(disabledNames("Who can edit?")).toEqual(["All players"]);
    await user.click(within(view).getByRole("radio", { name: "Only you" }));
    expect(within(edit).getByRole("radio", { name: "Only you" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(update).toHaveBeenCalledWith("entry-1", {
      readPermissions: ReadPermissions.OnlyAuthor,
      editPermissions: EditPermissions.OnlyAuthor,
    });
    expect(onClose).toHaveBeenCalled();
  });
});
