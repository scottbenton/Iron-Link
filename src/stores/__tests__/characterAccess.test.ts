import { describe, expect, it } from "vitest";

import { CharacterEditPermissions } from "repositories/character.repository";
import { GameType } from "repositories/game.repository";

import {
  getCharacterAccess,
  getDisplayedEditPermissions,
  getEditPermissionOptions,
} from "../characterAccess";
import { GamePermission } from "../game.store";

const OWNER = "owner-uid";
const OTHER = "other-uid";

const { OnlyOwner, GuidesAndOwner, AllPlayers } = CharacterEditPermissions;

describe("getCharacterAccess", () => {
  it.each([OnlyOwner, GuidesAndOwner, AllPlayers])(
    "lets the owner edit under %s",
    (editPermissions) => {
      expect(
        getCharacterAccess({
          uid: OWNER,
          ownerId: OWNER,
          editPermissions,
          gamePermission: GamePermission.Guide,
        }),
      ).toEqual({ isOwner: true, canEdit: true });
    },
  );

  it("lets the owner edit even when not counted as a member", () => {
    expect(
      getCharacterAccess({
        uid: OWNER,
        ownerId: OWNER,
        editPermissions: OnlyOwner,
        gamePermission: GamePermission.Viewer,
      }),
    ).toEqual({ isOwner: true, canEdit: true });
  });

  it.each([
    [GamePermission.Guide, OnlyOwner, false],
    [GamePermission.Guide, GuidesAndOwner, true],
    [GamePermission.Guide, AllPlayers, true],
    [GamePermission.Player, OnlyOwner, false],
    [GamePermission.Player, GuidesAndOwner, false],
    [GamePermission.Player, AllPlayers, true],
    [GamePermission.Viewer, OnlyOwner, false],
    [GamePermission.Viewer, GuidesAndOwner, false],
    [GamePermission.Viewer, AllPlayers, false],
    [null, AllPlayers, false],
  ])(
    "for a %s under %s, canEdit is %s",
    (gamePermission, editPermissions, canEdit) => {
      expect(
        getCharacterAccess({
          uid: OTHER,
          ownerId: OWNER,
          editPermissions,
          gamePermission,
        }),
      ).toEqual({ isOwner: false, canEdit });
    },
  );

  it("gives nothing when signed out or the character is missing", () => {
    expect(
      getCharacterAccess({
        uid: undefined,
        ownerId: OWNER,
        editPermissions: AllPlayers,
        gamePermission: GamePermission.Guide,
      }),
    ).toEqual({ isOwner: false, canEdit: false });
    expect(
      getCharacterAccess({
        uid: OTHER,
        ownerId: undefined,
        editPermissions: undefined,
        gamePermission: GamePermission.Guide,
      }),
    ).toEqual({ isOwner: false, canEdit: false });
  });
});

describe("getEditPermissionOptions", () => {
  it("offers guides only in guided games", () => {
    expect(getEditPermissionOptions(GameType.Guided)).toEqual([
      OnlyOwner,
      GuidesAndOwner,
      AllPlayers,
    ]);
    expect(getEditPermissionOptions(GameType.Coop)).toEqual([
      OnlyOwner,
      AllPlayers,
    ]);
    expect(getEditPermissionOptions(GameType.Solo)).toEqual([]);
  });
});

describe("getDisplayedEditPermissions", () => {
  it("shows a co-op guides_and_owner as all players", () => {
    expect(getDisplayedEditPermissions(GuidesAndOwner, GameType.Coop)).toBe(
      AllPlayers,
    );
  });

  it("keeps guides_and_owner in guided games", () => {
    expect(getDisplayedEditPermissions(GuidesAndOwner, GameType.Guided)).toBe(
      GuidesAndOwner,
    );
  });

  it("leaves the other settings alone", () => {
    expect(getDisplayedEditPermissions(OnlyOwner, GameType.Coop)).toBe(
      OnlyOwner,
    );
    expect(getDisplayedEditPermissions(AllPlayers, GameType.Coop)).toBe(
      AllPlayers,
    );
  });
});
