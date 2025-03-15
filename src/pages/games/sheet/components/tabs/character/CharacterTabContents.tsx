import { Stack } from "@chakra-ui/react";

import { CharacterConditionMeters } from "./CharacterConditionMeters";
import { CharacterExperience } from "./CharacterExperience";
import { CharacterImpacts } from "./CharacterImpacts";
import { CharacterLegacyTracks } from "./CharacterLegacyTracks";
import { CharacterOverview } from "./CharacterOverview";
import { CharacterStats } from "./CharacterStats";

export function CharacterTabContents() {
  return (
    <Stack gap={4}>
      <CharacterOverview />
      <CharacterStats />
      <CharacterConditionMeters />
      <CharacterImpacts />
      <CharacterLegacyTracks />
      <CharacterExperience />
    </Stack>
  );
}
