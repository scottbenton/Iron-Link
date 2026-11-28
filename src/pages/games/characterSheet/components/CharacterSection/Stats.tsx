import { useTranslation } from "react-i18next";

import { AddsControl } from "ui/game/ConditionMeter";
import { StatGrid } from "ui/game/StatCard";
import { capitalize } from "ui/game/shared";
import { SectionHeading } from "ui/layout";
import { Stack } from "ui/primitives";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog.ts";

import { useStatRules } from "stores/dataswornTree.store.ts";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store.ts";

import { DEFAULT_MOMENTUM } from "../../../../../data/constants.ts";
import { useCanEditCharacter } from "../../hooks/useCanEditCharacter.ts";
import { useCharacterId } from "../../hooks/useCharacterId.ts";

// Adds sit above the stats: they change whichever stat or meter the next
// roll uses.
export function Stats() {
  const { t } = useTranslation();
  const characterId = useCharacterId();
  const canEditCharacter = useCanEditCharacter();

  const stats = useGameCharacter((character) => character?.stats ?? {});
  const adds = useGameCharacter((character) => character?.adds ?? 0);
  const momentum = useGameCharacter(
    (character) => character?.momentum ?? DEFAULT_MOMENTUM,
  );
  const updateAdds = useGameCharactersStore(
    (store) => store.updateCharacterAdds,
  );

  const statRules = useStatRules();
  const rollStat = useRollStatAndAddToLog();

  const title = t("character.character-sidebar.stats", "Stats");

  return (
    <Stack gap="3">
      <AddsControl
        label={t("character.character-sidebar.adds", "Adds")}
        value={adds}
        onChange={
          canEditCharacter && characterId
            ? (value) => {
                updateAdds(characterId, value).catch(() => {});
              }
            : undefined
        }
      />
      <Stack gap="2" as="section">
        <SectionHeading title={title} as="h3" />
        <StatGrid
          label={title}
          stats={Object.entries(statRules).map(([key, rule]) => ({
            key,
            name: capitalize(rule.label),
            value: stats[key] ?? 0,
          }))}
          adds={adds}
          onRoll={
            canEditCharacter
              ? (stat) =>
                  rollStat({
                    statId: stat.key,
                    statLabel: statRules[stat.key].label,
                    statModifier: stats[stat.key] ?? 0,
                    adds,
                    momentum,
                  }).action
              : undefined
          }
        />
      </Stack>
    </Stack>
  );
}
