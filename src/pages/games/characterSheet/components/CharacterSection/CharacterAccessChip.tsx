import { useTranslation } from "react-i18next";

import { Chip } from "ui/components/Chip";
import { PencilSimpleIcon, UsersThreeIcon } from "ui/icons";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { getDisplayedEditPermissions } from "stores/characterAccess";
import {
  useCharacterAccess,
  useGameCharacter,
} from "stores/gameCharacters.store";
import { useMenuState } from "stores/menuState";
import { useUserName } from "stores/users.store";

import { CharacterEditPermissions } from "repositories/character.repository";
import { GameType } from "repositories/game.repository";

import { useCharacterId } from "../../hooks/useCharacterId";

// Tells an editor whose sheet they are filling in, and reminds the owner who
// else can change it.
export function CharacterAccessChip() {
  const { t } = useTranslation();

  const characterId = useCharacterId();
  const { isOwner, canEdit } = useCharacterAccess(characterId);
  const { gameType } = useGamePermissions();

  const ownerId = useGameCharacter((character) => character?.uid ?? null);
  const editPermissions = useGameCharacter(
    (character) => character?.editPermissions,
  );
  const ownerName = useUserName(ownerId);

  const setIsEditAccessDialogOpen = useMenuState(
    (store) => store.setIsCharacterEditAccessDialogOpen,
  );

  if (!canEdit) {
    return null;
  }

  if (!isOwner) {
    // Plain text: a tooltip on a chip that can't take focus would be
    // hover-only.
    return (
      <Chip size="sm" icon={<PencilSimpleIcon />}>
        {t("character.edit-access.shared-by", "Shared by {{name}}", {
          name: ownerName,
        })}
      </Chip>
    );
  }

  if (
    gameType === GameType.Solo ||
    !editPermissions ||
    editPermissions === CharacterEditPermissions.OnlyOwner
  ) {
    return null;
  }

  return (
    <Chip
      size="sm"
      icon={<UsersThreeIcon />}
      onClick={() => setIsEditAccessDialogOpen(true)}
    >
      {getDisplayedEditPermissions(editPermissions, gameType) ===
      CharacterEditPermissions.AllPlayers
        ? t(
            "character.edit-access.all-players-can-edit",
            "All Players Can Edit",
          )
        : t("character.edit-access.guides-can-edit", "Guides Can Edit")}
    </Chip>
  );
}
