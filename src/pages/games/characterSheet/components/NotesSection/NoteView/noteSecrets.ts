import type { SecretsConfig } from "components/RichTextEditor/secrets/useSecretsCompanion";

import { GamePermission } from "stores/game.store";

import { GameType } from "repositories/game.repository";
import { ReadPermissions } from "repositories/shared.types";

// A game note's secrets, for whoever is reading it. Only a Guide of a guided
// game gets them, whoever can read the note, so a Guide can prepare secrets
// before sharing it; solo and co-op games have none. A Guide who can't edit
// the note sees its secrets read-only, since the editor is read-only for them.
export function getNoteSecretsConfig(params: {
  gameId: string;
  noteId: string;
  gameType: GameType;
  gamePermission: GamePermission | null | undefined;
  readPermissions: ReadPermissions | undefined;
}): SecretsConfig | null {
  const { gameId, noteId, gameType, gamePermission, readPermissions } = params;
  if (
    gameType !== GameType.Guided ||
    gamePermission !== GamePermission.Guide ||
    !readPermissions
  ) {
    return null;
  }
  return {
    surface: { noteId },
    roomKeySource: { guideGameId: gameId },
    // Only its author reads an only_author note, and they're this Guide.
    audience: readPermissions === ReadPermissions.OnlyAuthor ? "you" : "guides",
    canInsert: true,
  };
}
