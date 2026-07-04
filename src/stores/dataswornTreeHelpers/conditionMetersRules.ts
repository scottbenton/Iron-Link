import { Datasworn } from "@datasworn-community/core";

export function parseConditionMeterRules(
  trees: Record<string, Datasworn.RulesPackage>,
): Record<string, Datasworn.ConditionMeterRule> {
  let conditionMeters: Record<string, Datasworn.ConditionMeterRule> = {};

  Object.values(trees).forEach((tree) => {
    conditionMeters = {
      ...conditionMeters,
      ...(tree.rules?.condition_meters ?? {}),
    };
  });

  return conditionMeters;
}
