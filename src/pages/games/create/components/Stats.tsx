import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ConditionMeter } from "components/datasworn/ConditonMeter";

import { useCreateCharacterStore } from "stores/createCharacter.store";
import { useStatRules } from "stores/dataswornTree.store";

export function Stats() {
  const statValues = useCreateCharacterStore((store) => store.stats);
  const setStat = useCreateCharacterStore((store) => store.setStat);

  const { t } = useTranslation();
  const stats = useStatRules();

  return (
    <>
      <Box mt={1}>
        <Typography
          display={"flex"}
          alignItems={"baseline"}
          color={"text.secondary"}
          sx={{ mr: 1 }}
        >
          {t(
            "character.create.choose-stats-helper-text",
            "Select a value for each stat.",
          )}
        </Typography>
      </Box>
      <Box display={"flex"} flexWrap={"wrap"} gap={1}>
        {Object.entries(stats).map(([statKey, stat]) => (
          <ConditionMeter
            key={statKey}
            label={stat.label}
            min={-9}
            max={9}
            defaultValue={0}
            value={statValues[statKey] ?? 0}
            onChange={(newValue) => {
              setStat(statKey, newValue);
            }}
          />
        ))}
      </Box>
    </>
  );
}
