import { useTranslation } from "react-i18next";

import { SectionHeading } from "components/SectionHeading";

import { Assets } from "./Assets";
import { CharacterDetails } from "./CharacterDetails";
import { Stats } from "./Stats";

export function CreateCharacter() {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading
        breakContainer
        rounded
        label={t("character.create.character-details", "Character Details")}
      />
      <CharacterDetails />
      <SectionHeading
        breakContainer
        rounded
        label={t("character.create.character-stats", "Character Stats")}
        sx={{ mt: 3 }}
      />
      <Stats />
      <SectionHeading
        breakContainer
        rounded
        label={t("character.create.character-assets", "Assets")}
        sx={{ mt: 3 }}
      />
      <Assets />
    </>
  );
}
