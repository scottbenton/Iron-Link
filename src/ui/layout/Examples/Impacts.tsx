import { starforgedRules } from "../../docs/fixtures/datasworn";
import type { ImpactGroup } from "../../game/ImpactsChecklist";
import { ImpactsSummary } from "../../game/ImpactsSummary";
import { PlaySheet } from "./usePlaySheet";

type LooseImpacts = Record<
  string,
  { label: string; contents: Record<string, { label: string }> }
>;

const impactGroups: ImpactGroup[] = Object.entries(
  starforgedRules.rules.impacts as LooseImpacts,
).map(([key, group]) => ({
  key,
  label: group.label,
  impacts: Object.entries(group.contents).map(([impactKey, impact]) => ({
    key: impactKey,
    label: impact.label,
  })),
}));

export function Impacts(props: { sheet: PlaySheet }) {
  const { sheet } = props;
  return (
    <ImpactsSummary
      groups={impactGroups}
      value={sheet.impacts}
      onImpactChange={sheet.setImpact}
    />
  );
}
