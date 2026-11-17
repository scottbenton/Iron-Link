import { Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { LinkComponent } from "components/LinkComponent";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { pathConfig } from "pages/pathConfig";

import { useGameCharactersStore } from "stores/gameCharacters.store";

import { useGameId } from "../hooks/useGameId";
import { GAME_TAB_ID } from "../hooks/useGameKeybinds";
import { useSortedGameCharacters } from "../hooks/useSortedGameCharacters";

export function GameTabs() {
  const gameId = useGameId();
  const characterId = useCharacterIdOptional();

  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isOnCharacterCreatePage = pathname.match(
    /\/games\/[^/]*\/create[/]?$/i,
  );

  const areCharactersLoading = useGameCharactersStore((store) => store.loading);

  const sortedGameCharacters = useSortedGameCharacters();

  if (areCharactersLoading) {
    return null;
  }

  return (
    <Tabs
      value={
        characterId ??
        (isOnCharacterCreatePage ? "create-character" : "overview")
      }
      variant="scrollable"
      scrollButtons="auto"
    >
      <Tab
        id={GAME_TAB_ID}
        LinkComponent={LinkComponent}
        href={pathConfig.game(gameId)}
        value={"overview"}
        label={t("game.layout.overview", "Overview")}
      />
      {sortedGameCharacters.map((character) => (
        <Tab
          LinkComponent={LinkComponent}
          href={pathConfig.gameCharacter(gameId, character.id)}
          key={character.id}
          value={character.id}
          label={character.name ?? t("common.loading", "Loading")}
        />
      ))}
      <Tab
        LinkComponent={LinkComponent}
        href={pathConfig.gameCharacterCreate(gameId)}
        value={"create-character"}
        label={t("game.layout.add-character", "Add Character")}
      />
    </Tabs>
  );
}
