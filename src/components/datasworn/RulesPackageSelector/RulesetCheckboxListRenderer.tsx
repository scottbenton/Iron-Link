import { Box, Checkbox, FormControlLabel } from "@mui/material";
import { Dispatch, SetStateAction } from "react";

import { IExpansionConfig, IRulesetConfig } from "data/package.config";

import { PlaysetConfig } from "repositories/game.repository";

import { ExpansionCheckboxListRenderer } from "./ExpansionCheckboxListRenderer";

export interface RulesetCheckboxListRendererProps {
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

export function RulesetCheckboxListRenderer(
  props: RulesetCheckboxListRendererProps,
) {
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

  return (
    <>
      {Object.entries(rulesets)
        .filter(([, ruleset]) =>
          renderMode === "homebrew" ? ruleset.isHomebrew : !ruleset.isHomebrew,
        )
        .map(([rulesetKey, ruleset]) => (
          <Box key={rulesetKey}>
            <FormControlLabel
              label={ruleset.name}
              control={
                <Checkbox checked={activeRulesetConfig[rulesetKey] ?? false} />
              }
              onChange={(_, checked) => onRulesetChange(rulesetKey, checked)}
            />
            <Box
              ml={1}
              borderColor={"divider"}
              borderLeft={`1px dotted`}
              pl={2}
            >
              <ExpansionCheckboxListRenderer
                rulesetKey={rulesetKey}
                expansions={expansions[rulesetKey] ?? {}}
                activeRulesetConfig={activeRulesetConfig}
                activeExpansionConfig={activeExpansionConfig}
                activePlaysetConfig={activePlaysetConfig}
                onPlaysetChange={onPlaysetChange}
                onExpansionChange={onExpansionChange}
                renderMode="official"
              />
              <ExpansionCheckboxListRenderer
                rulesetKey={rulesetKey}
                expansions={expansions[rulesetKey] ?? {}}
                activeRulesetConfig={activeRulesetConfig}
                activeExpansionConfig={activeExpansionConfig}
                activePlaysetConfig={activePlaysetConfig}
                onPlaysetChange={onPlaysetChange}
                onExpansionChange={onExpansionChange}
                renderMode="homebrew"
              />
            </Box>
          </Box>
        ))}
    </>
  );
}
