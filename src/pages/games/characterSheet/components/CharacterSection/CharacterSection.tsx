import { Box } from "@mui/material";

import { CharacterDetails } from "./CharacterDetails";
import { ConditionMeters } from "./ConditionMeters";
import { ExperienceSection } from "./ExperienceSection";
import { ImpactsSection } from "./ImpactsSection";
import { LegacyTracks } from "./LegacyTracks";
import { Stats } from "./Stats";

export function CharacterSection() {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <CharacterDetails />
      <Stats />
      <ConditionMeters />
      <ImpactsSection />
      <LegacyTracks />
      <ExperienceSection />
    </Box>
  );
}
