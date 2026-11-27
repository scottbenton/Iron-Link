import { useId } from "react";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "ui/layout";
import { Stack } from "ui/primitives";

import { Assets } from "./Assets";
import { CharacterDetails } from "./CharacterDetails";
import { Stats } from "./Stats";

// The create game character step, with library headings inside the page
// rail. The sections themselves stay MUI until slice 16, which also moves
// the add character page (`CreateCharacter`).
export function CreateCharacterStep() {
  const { t } = useTranslation();
  const id = useId();
  const detailsId = `${id}-details`;
  const statsId = `${id}-stats`;
  const assetsId = `${id}-assets`;

  return (
    <Stack gap="6">
      <Stack as="section" gap="3" aria-labelledby={detailsId}>
        <SectionHeading
          id={detailsId}
          title={t("character.create.character-details", "Character Details")}
        />
        <CharacterDetails />
      </Stack>
      <Stack as="section" gap="3" aria-labelledby={statsId}>
        <SectionHeading
          id={statsId}
          title={t("character.create.character-stats", "Character Stats")}
        />
        <Stats />
      </Stack>
      <Stack as="section" gap="3" aria-labelledby={assetsId}>
        <SectionHeading
          id={assetsId}
          title={t("character.create.character-assets", "Assets")}
        />
        <Assets />
      </Stack>
    </Stack>
  );
}
