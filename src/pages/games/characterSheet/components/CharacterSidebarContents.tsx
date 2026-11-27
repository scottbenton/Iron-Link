import { useTranslation } from "react-i18next";

import {
  ColumnTabPanel,
  ColumnTabs,
  useCharacterSheetSections,
} from "pages/games/gamePageLayout/columns";

import { useGamePageLayoutStore } from "stores/gamePageLayout.store";

import { AssetsSection } from "./AssetsSection";
import { CharacterSection } from "./CharacterSection";
import { TracksSection } from "./TracksSection";

// The character sheet column. Its heading and menu are the game page's.
export function CharacterSidebarContents() {
  const { t } = useTranslation();
  const sections = useCharacterSheetSections();
  const section = useGamePageLayoutStore((state) => state.characterSection);
  const setSection = useGamePageLayoutStore(
    (state) => state.setCharacterSection,
  );

  return (
    <ColumnTabs
      label={t("character.character-sidebar.sections", "Character Sections")}
      sections={sections}
      value={section}
      onValueChange={setSection}
    >
      <ColumnTabPanel value="overview">
        <CharacterSection />
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
