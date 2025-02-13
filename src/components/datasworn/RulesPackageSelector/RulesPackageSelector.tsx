import { Datasworn } from "@datasworn/core";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  SxProps,
  Theme,
} from "@mui/material";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  defaultBaseRulesets,
  defaultExpansions,
} from "data/datasworn.packages";

import { PlaysetConfig } from "repositories/game.repository";

import { PlaysetDialog } from "./PlaysetDialog";

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

  const rulesets = defaultBaseRulesets;
  const expansions = defaultExpansions;

  const { activeRulesets, activeExpansions } = useMemo(() => {
    const activeRulesets: Record<string, Datasworn.Ruleset> = {};
    const activeExpansions: Record<string, Datasworn.Expansion> = {};

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
      {Object.entries(rulesets).map(([rulesetKey, ruleset]) => (
        <Box key={rulesetKey}>
          <FormControlLabel
            label={ruleset.title}
            control={
              <Checkbox checked={activeRulesetConfig[rulesetKey] ?? false} />
            }
            onChange={(_, checked) => onRulesetChange(rulesetKey, checked)}
          />
          <Box ml={1} borderColor={"divider"} borderLeft={`1px dotted`} pl={2}>
            {Object.entries(expansions[rulesetKey] || {}).map(
              ([expansionKey, expansion]) => (
                <FormControlLabel
                  key={expansionKey}
                  label={expansion.title}
                  control={
                    <Checkbox
                      checked={
                        activeRulesetConfig[rulesetKey]
                          ? (activeExpansionConfig[rulesetKey]?.[
                              expansionKey
                            ] ?? false)
                          : false
                      }
                    />
                  }
                  onChange={(_, checked) =>
                    onExpansionChange(rulesetKey, expansionKey, checked)
                  }
                  disabled={!activeRulesetConfig[rulesetKey]} // Disable if the ruleset is not active
                />
              ),
            )}
          </Box>
        </Box>
      ))}
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
