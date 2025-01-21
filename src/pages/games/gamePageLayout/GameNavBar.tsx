import { Tab, Tabs } from "@mui/material";
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
import { MobileTabs } from "./MobileTabs";
import { useGameId } from "./hooks/useGameId";

export interface GameNavBarProps {
  tab: MobileTabs;
  setTab: (tab: MobileTabs) => void;
  isOnOverviewPage: boolean;
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
  const { tab, setTab, isOnOverviewPage, isOnCreatePage } = props;

  const hasCharacterId = !!useCharacterIdOptional();
  const gameId = useGameId();

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
      goBackTo={
        hasCharacterId || isOnCreatePage
          ? pathConfig.game(gameId)
          : pathConfig.gameSelect
      }
      pageTitle={pageTitle}
      secondLevel={
        isOnCreatePage ? undefined : (
          <Tabs
            value={tab}
            onChange={(_, newTab) => setTab(newTab)}
            variant="fullWidth"
            sx={{ flexGrow: 1, alignSelf: "flex-end" }}
          >
            <Tab
              id={`tab-${MobileTabs.Outlet}`}
              label={
                isOnOverviewPage
                  ? t("game.overview", "Overview")
                  : t("game.character", "Character")
              }
              value={MobileTabs.Outlet}
            />
            <Tab
              id={`tab-${MobileTabs.Notes}`}
              label={t("game.notes", "Notes")}
              value={MobileTabs.Notes}
            />
            <Tab
              id={`tab-${MobileTabs.Reference}`}
              label={t("game.reference", "Reference")}
              value={MobileTabs.Reference}
            />
          </Tabs>
        )
      }
      menuAdditions={{
        menuItems: menuItems,
        menuDialogs: menuDialogs,
      }}
    />
  );
}
