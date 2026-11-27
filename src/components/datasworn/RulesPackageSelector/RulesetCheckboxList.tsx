import { Dispatch, SetStateAction, useId } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox } from "ui/components/Checkbox";
import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import { IExpansionConfig, IRulesetConfig } from "data/package.config";

import { PlaysetConfig } from "repositories/game.repository";

import { ExpansionCheckboxList } from "./ExpansionCheckboxList";
import { LicenseInfo } from "./LicenseInfo";

export interface RulesetCheckboxListProps {
  rulesets: Record<string, IRulesetConfig>;
  renderMode: "homebrew" | "official";
  expansions: Record<string, Record<string, IExpansionConfig>>;
  activeRulesetConfig: Record<string, boolean>;
  activeExpansionConfig: Record<string, Record<string, boolean>>;
  onRulesetChange: (rulesetId: string, checked: boolean) => void;
  onExpansionChange: (
    rulesetId: string,
    expansionId: string,
    checked: boolean,
  ) => void;
  activePlaysetConfig: PlaysetConfig;
  onPlaysetChange: Dispatch<SetStateAction<PlaysetConfig>>;
}

/** The official or the third-party rulesets, each with its expansions. */
export function RulesetCheckboxList(props: RulesetCheckboxListProps) {
  const {
    rulesets,
    renderMode,
    expansions,
    activeRulesetConfig,
    activeExpansionConfig,
    onRulesetChange,
    onExpansionChange,
    onPlaysetChange,
    activePlaysetConfig,
  } = props;

  const { t } = useTranslation();
  const headingId = useId();

  const shownRulesets = Object.entries(rulesets).filter(([, ruleset]) =>
    renderMode === "homebrew" ? ruleset.isHomebrew : !ruleset.isHomebrew,
  );

  const expansionProps = {
    activeRulesetConfig,
    activeExpansionConfig,
    activePlaysetConfig,
    onPlaysetChange,
    onExpansionChange,
  };

  return (
    <Stack role="group" aria-labelledby={headingId} gap="2" width="100%">
      <Text id={headingId} variant="label" color="muted">
        {renderMode === "homebrew"
          ? t("ruleset-selector.homebrew", "Third-Party Rulesets")
          : t("ruleset-selector.official", "Official Rulesets")}
      </Text>
      {shownRulesets.map(([rulesetKey, ruleset]) => (
        <Stack key={rulesetKey} gap="1">
          <Checkbox
            label={ruleset.name}
            checked={activeRulesetConfig[rulesetKey] ?? false}
            onCheckedChange={(checked) => onRulesetChange(rulesetKey, checked)}
          />
          <LicenseInfo packageConfig={ruleset} />
          <Stack
            gap="1"
            marginInlineStart="2.5"
            paddingInlineStart="4"
            borderInlineStartWidth="1px"
            borderInlineStartStyle="dotted"
            borderColor="border.default"
          >
            <ExpansionCheckboxList
              rulesetKey={rulesetKey}
              expansions={expansions[rulesetKey] ?? {}}
              renderMode="official"
              {...expansionProps}
            />
            <ExpansionCheckboxList
              rulesetKey={rulesetKey}
              expansions={expansions[rulesetKey] ?? {}}
              renderMode="homebrew"
              {...expansionProps}
            />
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
