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
      audience: "guides",
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
    [ReadPermissions.GuidesAndAuthor, "guides"],
    [ReadPermissions.AllPlayers, "guides"],
    [ReadPermissions.Public, "guides"],
  ])("offers them in a %s note, seen by %s", (readPermissions, audience) => {
    expect(getNoteSecretsConfig({ ...base, readPermissions })).toMatchObject({
      audience,
      canInsert: true,
    });
  });
});
