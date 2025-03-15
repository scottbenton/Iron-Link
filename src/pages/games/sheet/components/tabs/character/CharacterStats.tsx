import { Stat } from "@/components/datasworn/Stat";
import { DEFAULT_MOMENTUM } from "@/data/constants";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterId } from "@/hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import { useRollStatAndAddToLog } from "@/hooks/useRollStatAndAddToLog";
import { useStatRules } from "@/stores/dataswornTree.store";
import { useGameCharacter } from "@/stores/gameCharacters.store";
import { Box, Heading } from "@chakra-ui/react";
import { DicesIcon } from "lucide-react";

import { CharacterAdds } from "./CharacterAdds";

export function CharacterStats() {
  const t = useGameTranslations();

  const characterId = useCharacterId();

  const stats = useStatRules();
  const characterStats = useGameCharacter(
    (character) => character?.stats ?? {},
  );

  const canRoll = useIsOwnerOfCharacter();

  const rollStat = useRollStatAndAddToLog();

  const adds = useGameCharacter((store) => store?.adds ?? 0);
  const momentum = useGameCharacter(
    (store) => store?.momentum ?? DEFAULT_MOMENTUM,
  );

  return (
    <Box>
      <Heading size="xl" textTransform="uppercase">
        {t("stats-section-heading", "Stats")}
      </Heading>
      <Box display="flex" gap={2} flexWrap="wrap">
        {Object.entries(stats).map(([statKey, stat]) => (
          <Stat
            key={statKey}
            label={stat.label}
            value={characterStats[statKey] ?? 0}
            action={
              canRoll
                ? { ActionIcon: DicesIcon, actionLabel: t("stat.roll", "Roll") }
                : undefined
            }
            onActionClick={
              canRoll
                ? () => {
                    rollStat({
                      statId: statKey,
                      statLabel: stat.label,
                      statModifier: characterStats[statKey] ?? 0,
                      adds,
                      momentum,
                      characterId,
                    });
                  }
                : undefined
            }
          />
        ))}
        <CharacterAdds />
      </Box>
    </Box>
  );
}
