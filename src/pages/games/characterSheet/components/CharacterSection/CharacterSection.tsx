import { Stack } from "ui/primitives";

import { CharacterDetails } from "./CharacterDetails";
import { ConditionMeters } from "./ConditionMeters";
import { ExperienceSection } from "./ExperienceSection";
import { ImpactsSection } from "./ImpactsSection";
import { LegacyTracks } from "./LegacyTracks";
import { Stats } from "./Stats";

// The character column's overview: who the character is, then everything a
// roll reads.
export function CharacterSection() {
  return (
    <Stack gap="6">
      <CharacterDetails />
      <Stats />
      <ConditionMeters />
      <ImpactsSection />
      <LegacyTracks />
      <ExperienceSection />
    </Stack>
  );
}
