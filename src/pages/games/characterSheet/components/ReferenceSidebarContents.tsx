import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { MoveTree } from "components/datasworn/MoveTree";
import { OracleTree } from "components/datasworn/OracleTree";

import {
  ColumnTabPanel,
  ColumnTabs,
  useReferenceSections,
} from "pages/games/gamePageLayout/columns";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import { ReferenceTabs, useAppState } from "stores/appState.store";

import { GameType } from "repositories/game.repository";

import { GameLog } from "./GameLog";
import { SecondScreenSectionSettings } from "./SecondScreenSection";

// The reference column: Moves, Oracles, the Game Log and, with the second
// screen on, its settings. Its heading is the game page's.
export function ReferenceSidebarContents() {
  const { t } = useTranslation();

  const currentTab = useAppState((state) => state.currentReferenceTab);
  const setCurrentTab = useAppState((state) => state.setCurrentReferenceTab);
  const { gameType } = useGamePermissions();
  const gameLogNotificationCount = useAppState(
    (state) => state.gameLogNotificationCount,
  );

  const secondScreenToggleIsActive = useSecondScreenFeature();
  const sections = useReferenceSections().map((section) =>
    section.id === ReferenceTabs.GameLog &&
    gameLogNotificationCount > 0 &&
    gameType !== GameType.Solo
      ? { ...section, unread: gameLogNotificationCount }
      : section,
  );

  useEffect(() => {
    if (
      !secondScreenToggleIsActive &&
      currentTab === ReferenceTabs.SecondScreen
    ) {
      setCurrentTab(ReferenceTabs.Moves);
    }
  }, [secondScreenToggleIsActive, currentTab, setCurrentTab]);

  return (
    <ColumnTabs
      label={t("character.reference-sidebar-sections", "Reference Sections")}
      sections={sections}
      value={currentTab}
      onValueChange={setCurrentTab}
      fill
    >
      <ColumnTabPanel value={ReferenceTabs.Moves} fill flush>
        <MoveTree />
      </ColumnTabPanel>
      <ColumnTabPanel value={ReferenceTabs.Oracles} fill flush>
        <OracleTree />
      </ColumnTabPanel>
      <ColumnTabPanel
        value={ReferenceTabs.GameLog}
        id="tabpanel-game-log"
        fill
        flush
        reversed
      >
        <GameLog open={currentTab === ReferenceTabs.GameLog} />
      </ColumnTabPanel>
      {secondScreenToggleIsActive && (
        <ColumnTabPanel value={ReferenceTabs.SecondScreen} fill flush>
          <SecondScreenSectionSettings
            open={currentTab === ReferenceTabs.SecondScreen}
          />
        </ColumnTabPanel>
      )}
    </ColumnTabs>
  );
}
