import { Datasworn, IdParser } from "@datasworn/core";
import { ironLinkAskTheOracleRulesPackage } from "@/data/askTheOracle";

export function getRulesetFromId(
  id: string,
  tree: Record<string, Datasworn.RulesPackage>,
): { id: string; title: string; isFromExpansion: boolean } | undefined {
  try {
    const result = IdParser.parse(id);
    const rulesPackageId = result.rulesPackageId;
    const rulesPackage = tree[rulesPackageId];
    if (!rulesPackage) return undefined;

    const rulesetId = rulesPackage.type === "ruleset"
      ? rulesPackage._id
      : rulesPackage.ruleset;
    const ruleset = tree[rulesetId];

    if (!ruleset || ruleset._id === ironLinkAskTheOracleRulesPackage._id) {
      return undefined;
    }

    return {
      id: ruleset._id,
      title: ruleset.title,
      isFromExpansion: ruleset.type === "expansion",
    };
  } catch {
    return undefined;
  }
}
