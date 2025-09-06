import SelectedIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import { Box, Button, SxProps, Theme } from "@mui/material";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  IExpansionConfig,
  IRulesetConfig,
  includedExpansions,
  includedRulesets,
} from "data/package.config";

import { PlaysetConfig } from "repositories/game.repository";

import { PlaysetDialog } from "./PlaysetDialog";
import { RulesetCheckboxListRenderer } from "./RulesetCheckboxListRenderer";

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
  sx?: SxProps<Theme>;
}

export function RulesPackageSelector(props: RulesPackageSelectorProps) {
  const {
    activeRulesetConfig,
    onRulesetChange,
    activeExpansionConfig,
    onExpansionChange,
    activePlaysetConfig,
    onPlaysetChange,
    sx,
  } = props;

  const { t } = useTranslation();

  const rulesets = includedRulesets;
  const expansions = includedExpansions;

  const { activeRulesets, activeExpansions } = useMemo(() => {
    const activeRulesets: Record<string, IRulesetConfig> = {};
    const activeExpansions: Record<string, IExpansionConfig> = {};

    Object.entries(activeRulesetConfig).forEach(([rulesetId, isActive]) => {
      if (isActive) {
        activeRulesets[rulesetId] = rulesets[rulesetId];
        Object.entries(activeExpansionConfig[rulesetId] ?? {}).forEach(
          ([expansionId, isActive]) => {
            if (isActive) {
              activeExpansions[expansionId] =
                expansions[rulesetId][expansionId];
            }
          },
        );
      }
    });

    return { activeRulesets, activeExpansions };
  }, [rulesets, activeRulesetConfig, expansions, activeExpansionConfig]);

  const [isPlaysetDialogOpen, setIsPlaysetDialogOpen] = useState(false);
  const hasActiveRulesets = Object.values(activeRulesetConfig).some(
    (val) => val,
  );

  return (
    <Box sx={sx}>
      <RulesetCheckboxListRenderer
        renderMode="official"
        rulesets={rulesets}
        activeRulesetConfig={activeRulesetConfig}
        onRulesetChange={onRulesetChange}
        expansions={expansions}
        activeExpansionConfig={activeExpansionConfig}
        onExpansionChange={onExpansionChange}
        activePlaysetConfig={activePlaysetConfig}
        onPlaysetChange={onPlaysetChange}
      />
      <RulesetCheckboxListRenderer
        renderMode="homebrew"
        rulesets={rulesets}
        activeRulesetConfig={activeRulesetConfig}
        onRulesetChange={onRulesetChange}
        expansions={expansions}
        activeExpansionConfig={activeExpansionConfig}
        onExpansionChange={onExpansionChange}
        activePlaysetConfig={activePlaysetConfig}
        onPlaysetChange={onPlaysetChange}
      />
      {hasActiveRulesets && (
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          color="inherit"
          onClick={() => setIsPlaysetDialogOpen(true)}
        >
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
    </Box>
  );
}
