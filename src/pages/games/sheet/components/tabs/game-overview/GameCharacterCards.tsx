import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useUID } from "@/stores/auth.store";
import { useGameCharactersStore } from "@/stores/gameCharacters.store";
import { Button, Stack } from "@chakra-ui/react";
import { Link } from "wouter";

import { CharacterCardConfig, GameCharacterCard } from "./GameCharacterCard";

export function GameCharacterCards() {
  const t = useGameTranslations();

  const uid = useUID();
  const characters = useGameCharactersStore<CharacterCardConfig[]>((store) => {
    return Object.entries(store.characters)
      .sort(([, c1], [, c2]) => {
        if (c1.uid !== c2.uid) {
          if (c1.uid === uid) {
            return -1;
          } else {
            return 1;
          }
        }
        return c1.name.localeCompare(c2.name);
      })
      .map(([id, value]) => {
        return {
          id,
          name: value.name,
          portraitSettings: value.profileImage ?? undefined,
          colorScheme: value.colorScheme ?? undefined,
          uid: value.uid,
        };
      });
  });

  return (
    <Stack mt={2}>
      {characters.map((character) => (
        <GameCharacterCard key={character.id} character={character} />
      ))}
      <Button
        asChild
        alignSelf={"start"}
        variant="subtle"
        colorPalette={"current"}
      >
        <Link to={"/create"}>
          {t("create-character-link", "Add a Character")}
        </Link>
      </Button>
    </Stack>
  );
}
