import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MenuAdditionComponent } from "components/Layout/AppSettingsMenu";
import { NavBar } from "components/Layout/NavBar";

import { pathConfig } from "pages/pathConfig";

import { useGameStore } from "stores/game.store";
import { useGameCharacter } from "stores/gameCharacters.store";

import { CharacterMenuDialogs } from "../characterSheet/components/CharacterSettingsMenu/CharacterMenuDialogs";
import { CharacterMenuItems } from "../characterSheet/components/CharacterSettingsMenu/CharacterMenuItems";
import { useCharacterIdOptional } from "../characterSheet/hooks/useCharacterId";
import { GameSettingsMenuDialogs } from "../overviewSheet/gameSettings/GameSettingsMenuDialogs";
import { GameSettingsMenuItems } from "../overviewSheet/gameSettings/GameSettingsMenuItems";
import { CharacterSwitcherMenu } from "./components/CharacterSwitcherMenu";

export interface GameNavBarProps {
  isOnCreatePage: boolean;
}

const menuItems: MenuAdditionComponent[] = [
  GameSettingsMenuItems,
  CharacterMenuItems,
];
const menuDialogs: MenuAdditionComponent[] = [
  GameSettingsMenuDialogs,
  CharacterMenuDialogs,
];

export function GameNavBar(props: GameNavBarProps) {
  const { isOnCreatePage } = props;

  const hasCharacterId = !!useCharacterIdOptional();

  const { t } = useTranslation();
  const gameName = useGameStore((store) => store.game?.name);
  const characterName = useGameCharacter((character) => character?.name);

  const pageTitle = useMemo(() => {
    if (!hasCharacterId) {
      return gameName ?? t("common.loading", "Loading");
    } else {
      return characterName ?? t("common.loading", "Loading");
    }
  }, [t, gameName, hasCharacterId, characterName]);

  return (
    <NavBar
      // The title switches between the game's characters and its overview,
      // so back leaves the game.
      goBackTo={pathConfig.gameSelect}
      goBackLabel={t("game.nav.back-to-games", "Back to your games")}
      pageTitle={pageTitle}
      pageTitleContent={
        <CharacterSwitcherMenu
          title={pageTitle}
          isOnCreatePage={isOnCreatePage}
        />
      }
      menuAdditions={{
        menuItems: menuItems,
        menuDialogs: menuDialogs,
      }}
    />
  );
}
