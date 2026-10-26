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
  it("offers secrets to a Guide of a guided game", () => {
    expect(getNoteSecretsConfig(base)).toEqual({
      surface: { noteId: "note" },
      roomKeySource: { guideGameId: "game" },
      sharedOnlyWith: null,
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
    "gives a %s game no secrets at all",
    (gameType) => {
      expect(getNoteSecretsConfig({ ...base, gameType })).toBeNull();
    },
  );

  // A Guide prepares secrets before sharing the note.
  it.each([
    [ReadPermissions.OnlyAuthor, "you"],
    [ReadPermissions.OnlyGuides, "guides"],
    [ReadPermissions.GuidesAndAuthor, null],
    [ReadPermissions.AllPlayers, null],
    [ReadPermissions.Public, null],
  ])(
    "offers them in a %s note, shared only with %s",
    (readPermissions, sharedOnlyWith) => {
      expect(getNoteSecretsConfig({ ...base, readPermissions })).toMatchObject({
        sharedOnlyWith,
        canInsert: true,
      });
    },
  );
});
