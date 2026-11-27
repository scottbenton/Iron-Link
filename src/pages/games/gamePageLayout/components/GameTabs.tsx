import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { PageTab, PageTabs } from "ui/components/Tabs";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { pathConfig } from "pages/pathConfig";

import { useGameCharactersStore } from "stores/gameCharacters.store";

import { useGameId } from "../hooks/useGameId";
import { GAME_TAB_ID } from "../hooks/useGameKeybinds";
import { useIsOnCharacterCreatePage } from "../hooks/useIsOnCharacterCreatePage";
import { useSortedGameCharacters } from "../hooks/useSortedGameCharacters";

/** The game's pages: Overview, each character, then Add Character. */
export function GameTabs() {
  const { t } = useTranslation();
  const gameId = useGameId();
  const characterId = useCharacterIdOptional();
  const isOnCreatePage = useIsOnCharacterCreatePage();
  const areCharactersLoading = useGameCharactersStore((store) => store.loading);
  const characters = useSortedGameCharacters();

  if (areCharactersLoading) {
    return null;
  }

  return (
    <PageTabs aria-label={t("game.layout.tabs", "Game Pages")}>
      <PageTab
        id={GAME_TAB_ID}
        current={!characterId && !isOnCreatePage}
        render={<LinkComponent href={pathConfig.game(gameId)} />}
      >
        {t("game.layout.overview", "Overview")}
      </PageTab>
      {characters.map((character) => (
        <PageTab
          key={character.id}
          current={character.id === characterId}
          render={
            <LinkComponent
              href={pathConfig.gameCharacter(gameId, character.id)}
            />
          }
        >
          {character.name}
        </PageTab>
      ))}
      <PageTab
        current={isOnCreatePage}
        render={<LinkComponent href={pathConfig.gameCharacterCreate(gameId)} />}
      >
        {t("game.layout.add-character", "Add Character")}
      </PageTab>
    </PageTabs>
  );
}
