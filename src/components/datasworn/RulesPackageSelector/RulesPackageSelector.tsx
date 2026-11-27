import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import { Stack } from "ui/primitives";

import {
  getExpansionDependencies,
  getExpansionDependents,
  includedExpansions,
  includedRulesets,
} from "data/package.config";

import { PlaysetConfig } from "repositories/game.repository";

import { PlaysetDialog } from "./PlaysetDialog";
import { RulesetCheckboxList } from "./RulesetCheckboxList";
import { getActivePackages } from "./getActivePackages";

export interface RulesPackageSelectorProps {
  activeRulesetConfig: Record<string, boolean>;
  onRulesetChange: (rulesetKey: string, isActive: boolean) => void;
  activeExpansionConfig: Record<string, Record<string, boolean>>;
  onExpansionChange: (
    rulesetKey: string,
    expansionKey: string,
    isActive: boolean,
  ) => void;
  activePlaysetConfig: PlaysetConfig;
  onPlaysetChange: Dispatch<SetStateAction<PlaysetConfig>>;
}

/**
 * Choose a game's rulesets and expansions, then optionally its playset: the
 * assets, moves and oracles it includes.
 */
export function RulesPackageSelector(props: RulesPackageSelectorProps) {
  const {
    activeRulesetConfig,
    onRulesetChange,
    activeExpansionConfig,
    onExpansionChange,
    activePlaysetConfig,
    onPlaysetChange,
  } = props;

  const { t } = useTranslation();

  const { activeRulesets, activeExpansions } = useMemo(
    () =>
      getActivePackages(
        includedRulesets,
        includedExpansions,
        activeRulesetConfig,
        activeExpansionConfig,
      ),
    [activeRulesetConfig, activeExpansionConfig],
  );

  const [isPlaysetDialogOpen, setIsPlaysetDialogOpen] = useState(false);
  const hasActiveRulesets = Object.keys(activeRulesets).length > 0;

  // Turning an expansion on turns on what it needs; turning it off turns off
  // what needs it.
  const handleExpansionChange = useCallback(
    (rulesetKey: string, expansionKey: string, isActive: boolean) => {
      const linked = isActive
        ? getExpansionDependencies(rulesetKey, expansionKey)
        : getExpansionDependents(rulesetKey, expansionKey);
      linked.forEach((linkedKey) => {
        onExpansionChange(rulesetKey, linkedKey, isActive);
      });
      onExpansionChange(rulesetKey, expansionKey, isActive);
    },
    [onExpansionChange],
  );

  const listProps = {
    rulesets: includedRulesets,
    activeRulesetConfig,
    onRulesetChange,
    expansions: includedExpansions,
    activeExpansionConfig,
    onExpansionChange: handleExpansionChange,
    activePlaysetConfig,
    onPlaysetChange,
  };

  return (
    <Stack gap="5" alignItems="flex-start">
      <RulesetCheckboxList renderMode="official" {...listProps} />
      <RulesetCheckboxList renderMode="homebrew" {...listProps} />
      {hasActiveRulesets && (
        <Button variant="outline" onClick={() => setIsPlaysetDialogOpen(true)}>
          {t("game.playset.edit", "Edit Playset")}
        </Button>
      )}
      <PlaysetDialog
        open={isPlaysetDialogOpen}
        onClose={() => setIsPlaysetDialogOpen(false)}
        playset={activePlaysetConfig}
        setPlayset={onPlaysetChange}
        rulesets={activeRulesets}
        expansions={activeExpansions}
      />
    </Stack>
  );
}
