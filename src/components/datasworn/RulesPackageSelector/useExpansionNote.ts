import { useTranslation } from "react-i18next";

import {
  IExpansionConfig,
  getExpansionDependencies,
  getExpansionDependents,
} from "data/package.config";

/**
 * What an expansion's checkbox should say beside its name: the expansions it
 * turns on with it, the ones it turns off with it, or else its own note.
 */
export function useExpansionNote(
  rulesetKey: string,
  expansionKey: string,
  expansions: Record<string, IExpansionConfig>,
): string | undefined {
  const { t } = useTranslation();
  const expansionName = expansions[expansionKey]?.name ?? "";

  const namesOf = (keys: string[]) =>
    keys
      .map((key) => expansions[key]?.name)
      .filter(Boolean)
      .join(", ");

  const dependencyList = namesOf(
    getExpansionDependencies(rulesetKey, expansionKey),
  );
  if (dependencyList) {
    return t(
      "ruleset-selector.expansion-enables-dependencies",
      "{{expansion}} uses content from {{dependencies}}, so enabling it also enables {{dependencies}}.",
      { expansion: expansionName, dependencies: dependencyList },
    );
  }

  const dependentList = namesOf(
    getExpansionDependents(rulesetKey, expansionKey),
  );
  if (dependentList) {
    return t(
      "ruleset-selector.expansion-disables-dependents",
      "{{dependents}} depends on {{expansion}}, so turning {{expansion}} off also turns {{dependents}} off.",
      { dependents: dependentList, expansion: expansionName },
    );
  }

  return expansions[expansionKey]?.note;
}
