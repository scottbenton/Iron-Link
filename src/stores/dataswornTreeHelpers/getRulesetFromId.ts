import { Datasworn, IdParser } from "@datasworn/core";

export function getRulesetFromId(
  id: string,
  tree: Record<string, Datasworn.RulesPackage>,
): { id: string; title: string; isFromExpansion: boolean } | undefined {
  try {
    const result = IdParser.parse(id);
    const rulesPackageId = result.rulesPackageId;
    const rulesPackage = tree[rulesPackageId];
    if (!rulesPackage) return undefined;

    const rulesetId =
      rulesPackage.type === "ruleset" ? rulesPackage._id : rulesPackage.ruleset;
    const ruleset = tree[rulesetId];

    return {
      id: ruleset._id,
      title: ruleset.title,
      isFromExpansion: ruleset.type === "expansion",
    };
  } catch {
    return undefined;
  }
}
