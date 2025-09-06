import { useTranslation } from "react-i18next";

import { useDataswornTree } from "stores/dataswornTree.store";

import { starforgedRulesetConfig } from "data/package.config";

import { InitiativeStatus } from "repositories/character.repository";

export function useInitiativeStatusText(shortVariants?: boolean) {
  const { t } = useTranslation();

  const rulesets = useDataswornTree();
  if (rulesets[starforgedRulesetConfig.id]) {
    return {
      [InitiativeStatus.HasInitiative]: t("datasworn.in-control", "In Control"),
      [InitiativeStatus.DoesNotHaveInitiative]: t(
        "datasworn.in-a-bad-spot",
        "In a Bad Spot",
      ),
      [InitiativeStatus.OutOfCombat]: t(
        "datasworn.out-of-combat",
        "Out of Combat",
      ),
    };
  } else {
    return {
      [InitiativeStatus.HasInitiative]: t(
        "datasworn.has-initiative",
        "Has Initiative",
      ),
      [InitiativeStatus.DoesNotHaveInitiative]: shortVariants
        ? t("datasworn.no-initiative-short", "No Initiative")
        : t("datasworn.no-initiative-long", "Does not have Initiative"),
      [InitiativeStatus.OutOfCombat]: t(
        "datasworn.out-of-combat",
        "Out of Combat",
      ),
    };
  }
}
