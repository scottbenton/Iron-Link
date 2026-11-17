import { Box } from "@mui/material";

import { useIsMobile } from "hooks/useIsMobile";

import { CharacterDetails } from "./CharacterDetails";
import { ConditionMeters } from "./ConditionMeters";
import { ExperienceSection } from "./ExperienceSection";
import { ImpactsSection } from "./ImpactsSection";
import { InitiativeSection } from "./InitiativeSection";
import { LegacyTracks } from "./LegacyTracks";
import { Stats } from "./Stats";

export function CharacterSection() {
  const isMobile = useIsMobile();

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {isMobile && <InitiativeSection />}
      <CharacterDetails />
      <Stats />
      <ConditionMeters />
      <ImpactsSection />
      <LegacyTracks />
      <ExperienceSection />
    </Box>
  );
}
