import { useTranslation } from "react-i18next";

import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { ColorScheme } from "repositories/shared.types";

import { SecondScreenCharacterCard } from "./SecondScreenCharacterCard";

/** Every character in the game, by name, for the table to see at a glance. */
export function CharacterSidebar() {
  const { t } = useTranslation();

  const gameColorScheme = useGameStore((store) => store.game?.colorScheme);

  const characters = useGameCharactersStore((store) =>
    Object.values(store.characters).sort((c1, c2) =>
      c1.name.localeCompare(c2.name),
    ),
  );

  return (
    <Stack gap="2" padding="2" overflowY="auto">
      <Text variant="h4" as="h2" color="muted">
        {t("second-screen.characters", "Characters")}
      </Text>
      {characters.map((character) => (
        <SecondScreenCharacterCard
          key={character.id}
          character={character}
          colorScheme={
            character.colorScheme ?? gameColorScheme ?? ColorScheme.Default
          }
        />
      ))}
    </Stack>
  );
}
