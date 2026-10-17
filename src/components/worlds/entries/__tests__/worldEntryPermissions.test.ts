import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import { translate } from "../../categories/__tests__/fixtures";
import {
  getLinkedWorldEntryPermissions,
  getWorldEntryPermissionOptions,
} from "../worldEntryPermissions";

const t = translate as unknown as TFunction;

// Mirrors the world_entries update policy's check on the saved row: who may
// hold an entry with each edit permission.
function policyAccepts(
  editPermissions: EditPermissions,
  { isAuthor, isGuide }: { isAuthor: boolean; isGuide: boolean },
) {
  switch (editPermissions) {
    case EditPermissions.AllPlayers:
      return true;
    case EditPermissions.GuidesAndAuthor:
      return isAuthor || isGuide;
    case EditPermissions.OnlyGuides:
      return isGuide;
    case EditPermissions.OnlyAuthor:
      return isAuthor;
  }
}

describe("getWorldEntryPermissionOptions", () => {
  it.each([
    { isAuthor: true, isGuide: false },
    { isAuthor: false, isGuide: true },
    { isAuthor: true, isGuide: true },
  ])("offers only edit settings the database accepts for %o", (role) => {
    const { editOptions } = getWorldEntryPermissionOptions(t, role);
    expect(editOptions.length).toBeGreaterThan(0);
    editOptions.forEach((option) =>
      expect(policyAccepts(option.value, role)).toBe(true),
    );
  });
});

describe("getLinkedWorldEntryPermissions", () => {
  const entry = (
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
  ) => ({ authorId: "player", readPermissions, editPermissions });
  const options = {
    gmOnly: false,
    isGuide: false,
    guided: true,
  };

  it("copies the linking entry's permissions for its author", () => {
    expect(
      getLinkedWorldEntryPermissions(
        t,
        entry(ReadPermissions.OnlyAuthor, EditPermissions.OnlyAuthor),
        { ...options, uid: "player" },
      ),
    ).toEqual({
      readPermissions: ReadPermissions.OnlyAuthor,
      editPermissions: EditPermissions.OnlyAuthor,
    });
  });

  it.each([ReadPermissions.OnlyAuthor, ReadPermissions.GuidesAndAuthor])(
    "shares an entry a Guide creates from a player's %s entry so the player can still read it",
    (readPermissions) => {
      expect(
        getLinkedWorldEntryPermissions(
          t,
          entry(readPermissions, EditPermissions.GuidesAndAuthor),
          { ...options, uid: "guide", isGuide: true },
        ),
      ).toEqual({
        readPermissions: ReadPermissions.AllPlayers,
        editPermissions: EditPermissions.GuidesAndAuthor,
      });
    },
  );

  it("copies permissions that are not author-scoped for other creators", () => {
    expect(
      getLinkedWorldEntryPermissions(
        t,
        entry(ReadPermissions.OnlyGuides, EditPermissions.OnlyGuides),
        { ...options, uid: "guide", isGuide: true },
      ),
    ).toEqual({
      readPermissions: ReadPermissions.OnlyGuides,
      editPermissions: EditPermissions.OnlyGuides,
    });
    expect(
      getLinkedWorldEntryPermissions(
        t,
        entry(ReadPermissions.AllPlayers, EditPermissions.AllPlayers),
        { ...options, uid: "other-player" },
      ),
    ).toEqual({
      readPermissions: ReadPermissions.AllPlayers,
      editPermissions: EditPermissions.AllPlayers,
    });
  });

  it("starts entries from a Guide-only field as Guide prep", () => {
    expect(
      getLinkedWorldEntryPermissions(
        t,
        entry(ReadPermissions.GuidesAndAuthor, EditPermissions.GuidesAndAuthor),
        { ...options, uid: "guide", isGuide: true, gmOnly: true },
      ),
    ).toEqual({
      readPermissions: ReadPermissions.OnlyGuides,
      editPermissions: EditPermissions.OnlyGuides,
    });
  });

  it("falls back to the creator's defaults for settings they cannot pick", () => {
    expect(
      getLinkedWorldEntryPermissions(
        t,
        entry(ReadPermissions.OnlyGuides, EditPermissions.OnlyGuides),
        { ...options, uid: "other-player" },
      ),
    ).toEqual({
      readPermissions: ReadPermissions.AllPlayers,
      editPermissions: EditPermissions.GuidesAndAuthor,
    });
  });
});
