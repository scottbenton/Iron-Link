import { useTranslation } from "react-i18next";

import { ImpactGroup } from "ui/game/ImpactsChecklist";
import { ImpactsSummary } from "ui/game/ImpactsSummary";
import { capitalize } from "ui/game/shared";
import { SectionHeading } from "ui/layout";
import { Stack } from "ui/primitives";

import { useImpactRules } from "stores/dataswornTree.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterId } from "../../hooks/useCharacterId";
import { useImpactsWording } from "../../hooks/useImpactsWording";

export function ImpactsSection() {
  const { t } = useTranslation();
  const characterId = useCharacterId();
  const canEditCharacter = useCanEditCharacter();
  const wording = useImpactsWording();

  const impacts = useGameCharacter((character) => character?.debilities ?? {});
  const { impactCategories } = useImpactRules();
  const updateImpactValue = useGameCharactersStore(
    (store) => store.updateCharacterImpactValue,
  );

  const groups: ImpactGroup[] = Object.entries(impactCategories).map(
    ([key, category]) => ({
      key,
      label: capitalize(category.label),
      impacts: Object.entries(category.contents).map(([impactKey, rule]) => ({
        key: impactKey,
        label: capitalize(rule.label),
      })),
    }),
  );

  return (
    <Stack gap="2" as="section">
      <SectionHeading
        title={
          wording === "ironsworn"
            ? t("character.character-sidebar.debilities", "Debilities")
            : t("character.character-sidebar.impacts", "Impacts")
        }
        as="h3"
      />
      <ImpactsSummary
        groups={groups}
        value={impacts}
        wording={wording}
        onImpactChange={
          canEditCharacter && characterId
            ? (key, marked) => updateImpactValue(characterId, key, marked)
            : undefined
        }
      />
    </Stack>
  );
}
