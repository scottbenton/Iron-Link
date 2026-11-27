import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import { Text } from "ui/components/Text";

import { IExpansionConfig } from "data/package.config";

import { PlaysetConfig } from "repositories/game.repository";

import { ExpansionCheckbox } from "./ExpansionCheckbox";

export interface ExpansionCheckboxListProps {
  rulesetKey: string;
  expansions: Record<string, IExpansionConfig>;
  activeRulesetConfig: Record<string, boolean>;
  activeExpansionConfig: Record<string, Record<string, boolean>>;
  activePlaysetConfig: PlaysetConfig;
  onPlaysetChange: Dispatch<SetStateAction<PlaysetConfig>>;
  onExpansionChange: (
    rulesetId: string,
    expansionId: string,
    checked: boolean,
  ) => void;
  renderMode: "homebrew" | "official";
}

/** A ruleset's official or third-party expansions. */
export function ExpansionCheckboxList(props: ExpansionCheckboxListProps) {
  const { expansions, renderMode } = props;
  const { t } = useTranslation();

  const shownExpansions = Object.entries(expansions).filter(([, expansion]) =>
    renderMode === "homebrew" ? expansion.isHomebrew : !expansion.isHomebrew,
  );

  return (
    <>
      {renderMode === "homebrew" && shownExpansions.length > 0 && (
        <Text variant="label" color="muted" css={{ mt: "2" }}>
          {t("ruleset-selector.homebrew-expansions", "Third-Party Expansions")}
        </Text>
      )}
      {shownExpansions.map(([expansionKey, expansion]) => (
        <ExpansionCheckbox
          key={expansionKey}
          expansionKey={expansionKey}
          expansion={expansion}
          {...props}
        />
      ))}
    </>
  );
}
