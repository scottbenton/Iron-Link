import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorldStore } from "stores/world.store";

import {
  EditPermissions,
  ReadPermissions,
  WorldPermission,
} from "repositories/shared.types";

import { WorldEntriesService } from "services/worldEntries.service";

import { category, translate } from "../../categories/__tests__/fixtures";
import { WorldEntryCreateDialog } from "../WorldEntryCreateDialog";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "creator" }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

function renderDialog(permission: WorldPermission, isGuided: boolean) {
  useWorldStore.setState({ worldPermission: permission, isGuided });
  const create = vi
    .spyOn(WorldEntriesService, "addWorldEntry")
    .mockResolvedValue("new-entry");
  const onCreated = vi.fn();
  render(
    <WorldEntryCreateDialog
      category={category}
      onCreated={onCreated}
      onClose={() => {}}
    />,
  );
  return { create, onCreated };
}

async function createNamed(name: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox", { name: /Name/ }), name);
  await user.click(screen.getByRole("button", { name: "Create" }));
}

describe("WorldEntryCreateDialog", () => {
  it("starts a Guide's entry as Guide-only prep when permission controls show", async () => {
    const { create, onCreated } = renderDialog(WorldPermission.Guide, true);
    expect(screen.getByRole("radio", { name: "Guides only" })).toBeChecked();
    expect(
      screen.queryByRole("radiogroup", { name: "Who can edit?" }),
    ).not.toBeInTheDocument();
    await createNamed(" Hollowmere ");
    expect(create).toHaveBeenCalledWith(
      "creator",
      category.worldId,
      category.id,
      "Hollowmere",
      ReadPermissions.OnlyGuides,
      EditPermissions.OnlyGuides,
      undefined,
    );
    expect(onCreated).toHaveBeenCalledWith("new-entry");
  });

  it("shares a player's entry with everyone, and narrows edit to the chosen visibility", async () => {
    const { create } = renderDialog(WorldPermission.Player, true);
    expect(screen.getByRole("radio", { name: "All players" })).toBeChecked();
    // Players cannot create entries they would be unable to read.
    expect(
      screen.queryByRole("radio", { name: "Guides only" }),
    ).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("radio", { name: "Only you" }));
    await createNamed("Secret stash");
    expect(create).toHaveBeenCalledWith(
      "creator",
      category.worldId,
      category.id,
      "Secret stash",
      ReadPermissions.OnlyAuthor,
      EditPermissions.OnlyAuthor,
      undefined,
    );
  });

  it.each([WorldPermission.Owner, WorldPermission.Player])(
    "asks only for a name and shares the entry when the world is not guided (%s)",
    async (permission) => {
      const { create } = renderDialog(permission, false);
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
      await createNamed("Hollowmere");
      expect(create).toHaveBeenCalledWith(
        "creator",
        category.worldId,
        category.id,
        "Hollowmere",
        ReadPermissions.AllPlayers,
        EditPermissions.GuidesAndAuthor,
        undefined,
      );
    },
  );
});
