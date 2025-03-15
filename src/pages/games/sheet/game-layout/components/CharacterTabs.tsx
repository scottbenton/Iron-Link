import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import {
  useCharacterIdOptional,
  useSetCharacterId,
} from "@/hooks/useCharacterId";
import { useGamePermissions } from "@/hooks/usePermissions";
import { GameType } from "@/repositories/game.repository";
import { useUID } from "@/stores/auth.store";
import { useGameCharactersStore } from "@/stores/gameCharacters.store";
import { Box, Button, Tabs } from "@chakra-ui/react";
import { Link } from "wouter";

const overviewKey = "overview";

export function CharacterTabs() {
  const t = useGameTranslations();

  const uid = useUID();
  const characters = useGameCharactersStore((store) => {
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
        };
      });
  });

  const characterId = useCharacterIdOptional();

  const { gameType } = useGamePermissions();

  const setCharacterId = useSetCharacterId();

  return (
    <Box
      display="flex"
      alignItems="center"
      flexWrap={"wrap"}
      gap={2}
      justifyContent={"space-between"}
    >
      <Tabs.Root
        lazyMount
        value={characterId || overviewKey}
        onValueChange={({ value }) => {
          setCharacterId(value === overviewKey ? null : value);
        }}
        overflow="auto"
        variant="subtle"
      >
        <Tabs.List>
          {(gameType !== GameType.Solo || characters.length !== 1) && (
            <Tabs.Trigger
              value={overviewKey}
              aria-controls="overview-tab-panel"
              flexShrink={0}
            >
              {t("game-tabs-overview", "Overview")}
            </Tabs.Trigger>
          )}
          {characters.map((character) => (
            <Tabs.Trigger
              key={character.id}
              value={character.id}
              aria-controls={"character-tab-panel-" + character.id}
            >
              {character.name}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>
      <Button asChild colorPalette="gray" variant="subtle">
        <Link to={"/create"}>
          {t("game-tabs-add-character", "Add Character")}
        </Link>
      </Button>
    </Box>
  );
}
