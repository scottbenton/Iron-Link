import type { SecretsConfig } from "components/RichTextEditor/secrets/useSecretsCompanion";

import { GamePermission } from "stores/game.store";

import { GameType } from "repositories/game.repository";
import { ReadPermissions } from "repositories/shared.types";

// A game note's secrets, for whoever is reading it. Only a Guide (the guide
// role, or any member of a solo or co-op game) gets them. New secrets are
// offered only where someone who isn't a Guide can read the note: in a guided
// game, and not in a note only Guides can read (only_guides, or only_author
// when the reader, its author, is a Guide).
export function getNoteSecretsConfig(params: {
  gameId: string;
  noteId: string;
  gameType: GameType;
  gamePermission: GamePermission | null | undefined;
  readPermissions: ReadPermissions | undefined;
}): SecretsConfig | null {
  const { gameId, noteId, gameType, gamePermission, readPermissions } = params;
  if (gamePermission !== GamePermission.Guide || !readPermissions) return null;
  const canInsert =
    gameType === GameType.Guided &&
    readPermissions !== ReadPermissions.OnlyGuides &&
    readPermissions !== ReadPermissions.OnlyAuthor;
  return {
    surface: { noteId },
    roomKeySource: { guideGameId: gameId },
    canInsert,
  };
}
