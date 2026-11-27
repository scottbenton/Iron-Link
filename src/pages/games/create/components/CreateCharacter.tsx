import { useTranslation } from "react-i18next";

import { SectionHeading } from "components/SectionHeading";

import { Assets } from "./Assets";
import { CharacterDetails } from "./CharacterDetails";
import { Stats } from "./Stats";

// The add character page. Create game uses `CreateCharacterStep`; slice 16
// moves this page onto the library.
export function CreateCharacter() {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading
        breakContainer
        rounded
        label={t("character.create.character-details", "Character Details")}
        sx={{ mb: 1 }}
      />
      <CharacterDetails />
      <SectionHeading
        breakContainer
        rounded
        label={t("character.create.character-stats", "Character Stats")}
        sx={{ mt: 3, mb: 1 }}
      />
      <Stats />
      <SectionHeading
        breakContainer
        rounded
        label={t("character.create.character-assets", "Assets")}
        sx={{ mt: 3, mb: 2 }}
      />
      <Assets />
    </>
  );
}
