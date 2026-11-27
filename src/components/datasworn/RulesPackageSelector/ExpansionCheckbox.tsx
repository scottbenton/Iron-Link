import { Checkbox } from "ui/components/Checkbox";

import { IExpansionConfig } from "data/package.config";

import { DefaultPlaysetPicker } from "./DefaultPlaysetPicker";
import type { ExpansionCheckboxListProps } from "./ExpansionCheckboxList";
import { LicenseInfo } from "./LicenseInfo";
import { useExpansionNote } from "./useExpansionNote";

export interface ExpansionCheckboxProps extends ExpansionCheckboxListProps {
  expansionKey: string;
  expansion: IExpansionConfig;
}

/**
 * One expansion: off while its ruleset is, with what it needs or what needs
 * it as its description, and default playsets once it is on.
 */
export function ExpansionCheckbox(props: ExpansionCheckboxProps) {
  const {
    rulesetKey,
    expansionKey,
    expansion,
    expansions,
    activeRulesetConfig,
    activeExpansionConfig,
    activePlaysetConfig,
    onPlaysetChange,
    onExpansionChange,
  } = props;

  const note = useExpansionNote(rulesetKey, expansionKey, expansions);
  const isRulesetActive = !!activeRulesetConfig[rulesetKey];
  const isActive =
    isRulesetActive && !!activeExpansionConfig[rulesetKey]?.[expansionKey];

  return (
    <>
      <Checkbox
        label={expansion.name}
        description={note}
        checked={isActive}
        disabled={!isRulesetActive}
        onCheckedChange={(checked) =>
          onExpansionChange(rulesetKey, expansionKey, checked)
        }
      />
      <LicenseInfo packageConfig={expansion} />
      <DefaultPlaysetPicker
        expansionId={expansion.id}
        open={isActive}
        activePlaysetConfig={activePlaysetConfig}
        onPlaysetChange={onPlaysetChange}
      />
    </>
  );
}
