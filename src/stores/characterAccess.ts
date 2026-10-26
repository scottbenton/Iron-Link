import { CharacterEditPermissions } from "repositories/character.repository";
import { GameType } from "repositories/game.repository";

import { GamePermission } from "./game.store";

export interface CharacterAccess {
  isOwner: boolean;
  canEdit: boolean;
}

// Mirrors public.can_edit_character(): the owner always edits, guides edit
// unless the sheet is only_owner, and players edit when it is all_players.
// Viewers and people outside the game never edit. Solo and co-op members
// already arrive here as guides, as they do in the database.
export function getCharacterAccess(params: {
  uid: string | undefined;
  ownerId: string | undefined;
  editPermissions: CharacterEditPermissions | undefined;
  gamePermission: GamePermission | null;
}): CharacterAccess {
  const { uid, ownerId, editPermissions, gamePermission } = params;

  if (!uid || !ownerId) {
    return { isOwner: false, canEdit: false };
  }
  if (uid === ownerId) {
    return { isOwner: true, canEdit: true };
  }

  let canEdit = false;
  if (editPermissions === CharacterEditPermissions.AllPlayers) {
    canEdit =
      gamePermission === GamePermission.Guide ||
      gamePermission === GamePermission.Player;
  } else if (editPermissions === CharacterEditPermissions.GuidesAndOwner) {
    canEdit = gamePermission === GamePermission.Guide;
  }

  return { isOwner: false, canEdit };
}

// Co-op games have no separate guides, so "guides and owner" reaches every
// player there, the same as "all players". Solo games share with nobody.
export function getEditPermissionOptions(
  gameType: GameType,
): CharacterEditPermissions[] {
  switch (gameType) {
    case GameType.Guided:
      return [
        CharacterEditPermissions.OnlyOwner,
        CharacterEditPermissions.GuidesAndOwner,
        CharacterEditPermissions.AllPlayers,
      ];
    case GameType.Coop:
      return [
        CharacterEditPermissions.OnlyOwner,
        CharacterEditPermissions.AllPlayers,
      ];
    case GameType.Solo:
      return [];
  }
}

// The option a stored setting is shown as, so a co-op guides_and_owner reads
// as all players.
export function getDisplayedEditPermissions(
  editPermissions: CharacterEditPermissions,
  gameType: GameType,
): CharacterEditPermissions {
  if (
    gameType === GameType.Coop &&
    editPermissions === CharacterEditPermissions.GuidesAndOwner
  ) {
    return CharacterEditPermissions.AllPlayers;
  }
  return editPermissions;
}
