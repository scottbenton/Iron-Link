import { useTranslation } from "react-i18next";

import { AppSettingsMenu } from "components/Layout/AppSettingsMenu";

import { CharacterSwitcher } from "ui/game/CharacterSwitcher";
import { NavBar } from "ui/layout";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { pathConfig } from "pages/pathConfig";

import { useGameStore } from "stores/game.store";
import { useGameCharacter } from "stores/gameCharacters.store";

import { useGameId } from "../hooks/useGameId";
import { useIsOnCharacterCreatePage } from "../hooks/useIsOnCharacterCreatePage";
import { useSortedGameCharacters } from "../hooks/useSortedGameCharacters";

export interface GamePageNavBarProps {
  /** The phone layout: a back button and the character switcher. */
  phone: boolean;
}

/**
 * The game page's bar. Its title is the page's h1: on phones the character
 * switcher, which stands in for the page tabs; wider, the character's or the
 * game's name, read by screen readers only.
 */
export function GamePageNavBar(props: GamePageNavBarProps) {
  const { phone } = props;
  const { t } = useTranslation();
  const gameId = useGameId();
  const characterId = useCharacterIdOptional();
  const isOnCreatePage = useIsOnCharacterCreatePage();
  const gameName = useGameStore((state) => state.game?.name);
  const characterName = useGameCharacter((character) => character?.name);
  const characters = useSortedGameCharacters();

  const loading = t("common.loading", "Loading");
  const pageName = characterId ? characterName : gameName;

  return (
    <NavBar
      title={
        phone ? (
          <CharacterSwitcher
            characters={characters.map((character) => ({
              ...character,
              href: pathConfig.gameCharacter(gameId, character.id),
            }))}
            current={characterId ?? (isOnCreatePage ? "add" : "overview")}
            gameName={gameName ?? loading}
            overviewHref={pathConfig.game(gameId)}
            addCharacterHref={pathConfig.gameCharacterCreate(gameId)}
          />
        ) : (
          (pageName ?? loading)
        )
      }
      backHref={
        phone
          ? characterId || isOnCreatePage
            ? pathConfig.game(gameId)
            : pathConfig.gameSelect
          : undefined
      }
      actions={<AppSettingsMenu />}
    />
  );
}
