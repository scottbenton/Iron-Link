import { describe, expect, it } from "vitest";

import { GamePermission } from "stores/game.store";

import { GameType } from "repositories/game.repository";
import { ReadPermissions } from "repositories/shared.types";

import { getNoteSecretsConfig } from "../noteSecrets";

const base = {
  gameId: "game",
  noteId: "note",
  gameType: GameType.Guided,
  gamePermission: GamePermission.Guide,
  readPermissions: ReadPermissions.AllPlayers,
};

describe("getNoteSecretsConfig", () => {
  it("offers secrets to a Guide of a guided game in a note players read", () => {
    expect(getNoteSecretsConfig(base)).toEqual({
      surface: { noteId: "note" },
      roomKeySource: { guideGameId: "game" },
      canInsert: true,
    });
  });

  it.each([GamePermission.Player, GamePermission.Viewer, null])(
    "gives a %s no secrets at all",
    (gamePermission) => {
      expect(getNoteSecretsConfig({ ...base, gamePermission })).toBeNull();
    },
  );

  it.each([GameType.Solo, GameType.Coop])(
    "shows a %s game's existing secrets but offers no new ones",
    (gameType) => {
      expect(getNoteSecretsConfig({ ...base, gameType })?.canInsert).toBe(
        false,
      );
    },
  );

  it.each([ReadPermissions.OnlyGuides, ReadPermissions.OnlyAuthor])(
    "offers none in a note only Guides can read (%s)",
    (readPermissions) => {
      expect(
        getNoteSecretsConfig({ ...base, readPermissions })?.canInsert,
      ).toBe(false);
    },
  );

  it.each([
    ReadPermissions.Public,
    ReadPermissions.GuidesAndAuthor,
    ReadPermissions.AllPlayers,
  ])("offers them where players can read the note (%s)", (readPermissions) => {
    expect(getNoteSecretsConfig({ ...base, readPermissions })?.canInsert).toBe(
      true,
    );
  });
});
