import { ConditionMeter } from "@/components/datasworn/ConditonMeter";
import { useCharacterCreateTranslations } from "@/hooks/i18n/useCharacterCreateTranslations";
import { useCreateCharacterStore } from "@/stores/createCharacter.store";
import { useStatRules } from "@/stores/dataswornTree.store";
import { Box, Text } from "@chakra-ui/react";

export function CreateCharacterStats() {
  const statValues = useCreateCharacterStore((store) => store.stats);
  const setStat = useCreateCharacterStore((store) => store.setStat);

  const t = useCharacterCreateTranslations();
  const stats = useStatRules();

  return (
    <>
      <Box mt={1}>
        <Text color={"fg.muted"} mr={1}>
          {t(
            "character.create.choose-stats-helper-text",
            "Select a value for each stat.",
          )}
        </Text>
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
