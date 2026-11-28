import { useTranslation } from "react-i18next";

import { Text } from "ui/components/Text";
import { ConditionMeter } from "ui/game/ConditionMeter";
import { Grid, Stack } from "ui/primitives";

import { useCreateCharacterStore } from "stores/createCharacter.store";
import { useStatRules } from "stores/dataswornTree.store";

export function Stats() {
  const statValues = useCreateCharacterStore((store) => store.stats);
  const setStat = useCreateCharacterStore((store) => store.setStat);

  const { t } = useTranslation();
  const stats = useStatRules();

  return (
    <Stack gap="3">
      <Text color="muted">
        {t(
          "character.create.choose-stats-helper-text",
          "Select a value for each stat.",
        )}
      </Text>
      {/* As many to a row as fit, each wide enough for its two steppers
          either side of the value, which grow on touch. */}
      <Grid
        gap="2"
        gridTemplateColumns={{
          base: "repeat(auto-fill, minmax(136px, 1fr))",
          _touch: "repeat(auto-fill, minmax(152px, 1fr))",
        }}
      >
        {Object.entries(stats).map(([statKey, stat]) => (
          <ConditionMeter
            key={statKey}
            label={stat.label}
            min={-9}
            max={9}
            value={statValues[statKey] ?? 0}
            onChange={(newValue) => setStat(statKey, newValue)}
          />
        ))}
      </Grid>
    </Stack>
  );
}
