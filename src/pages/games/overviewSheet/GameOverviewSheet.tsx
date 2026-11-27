import { useTranslation } from "react-i18next";

import {
  ColumnTabPanel,
  ColumnTabs,
  useGameOverviewSections,
} from "pages/games/gamePageLayout/columns";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useGamePageLayoutStore } from "stores/gamePageLayout.store";

import { AssetsSection } from "../characterSheet/components/AssetsSection";
import { TracksSection } from "../characterSheet/components/TracksSection";
import { CharactersAndUsersTab } from "./CharactersAndUsersTab";
import { GameOverviewHeader } from "./GameOverviewHeader";

// The game overview column, in the character sheet's place on the game's
// Overview page. Its heading is the game page's; the game's name and
// settings head its Characters section, as the character's head the sheet.
export default function GameOverviewSheet() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.GameOverview);

  const sections = useGameOverviewSections();
  const section = useGamePageLayoutStore((state) => state.overviewSection);
  const setSection = useGamePageLayoutStore(
    (state) => state.setOverviewSection,
  );

  return (
    <ColumnTabs
      label={t("game.overview-sidebar.sections", "Game Overview Sections")}
      sections={sections}
      value={section}
      onValueChange={setSection}
    >
      <ColumnTabPanel value="characters">
        <GameOverviewHeader />
        <CharactersAndUsersTab />
      </ColumnTabPanel>
      <ColumnTabPanel value="assets">
        <AssetsSection />
      </ColumnTabPanel>
      <ColumnTabPanel value="tracks">
        <TracksSection />
      </ColumnTabPanel>
    </ColumnTabs>
  );
}
