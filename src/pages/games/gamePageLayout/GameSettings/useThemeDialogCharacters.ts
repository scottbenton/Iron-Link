import { useMemo } from "react";

import { toThemeChoice } from "providers/ThemeProvider/themeChoices";

import type { ThemeDialogCharacter } from "ui/game/ThemeDialog";

import { useUID } from "stores/auth.store";
import { useCharacterStore } from "stores/character.store";
import { getCharacterAccess } from "stores/characterAccess";
import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useUsersStore } from "stores/users.store";

/** The game's characters the person can edit, as Theme dialog rows. */
export function useThemeDialogCharacters(): ThemeDialogCharacter[] {
  const uid = useUID();
  const gamePermission = useGameStore((store) => store.gamePermissions);
  const characters = useGameCharactersStore((store) => store.characters);
  const portraits = useCharacterStore((store) => store.portraits);
  const users = useUsersStore((store) => store.users);

  return useMemo(
    () =>
      Object.values(characters)
        .filter(
          (character) =>
            getCharacterAccess({
              uid,
              ownerId: character.uid,
              editPermissions: character.editPermissions,
              gamePermission,
            }).canEdit,
        )
        .map((character) => ({
          id: character.id,
          name: character.name,
          portraitUrl: portraits[character.id]?.url,
          crop: character.profileImage
            ? {
                position: character.profileImage.position,
                scale: character.profileImage.scale,
              }
            : undefined,
          theme: toThemeChoice(character.colorScheme),
          sharedBy:
            character.uid !== uid
              ? (users[character.uid]?.user?.name ?? undefined)
              : undefined,
        })),
    [characters, portraits, users, uid, gamePermission],
  );
}
