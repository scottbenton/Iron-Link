import SelectedIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import {
  Box,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { IExpansionConfig } from "data/package.config";
import { defaultPlaysets } from "data/playset.config";

import { PlaysetConfig } from "repositories/game.repository";

import { LicenseInfo } from "./LicenseInfo";

export interface ExpansionCheckboxListRendererProps {
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

export function ExpansionCheckboxListRenderer(
  props: ExpansionCheckboxListRendererProps,
) {
  const {
    rulesetKey,
    expansions,
    activeRulesetConfig,
    activeExpansionConfig,
    activePlaysetConfig,
    onPlaysetChange,
    onExpansionChange,
    renderMode,
  } = props;

  const filteredExpansions = useMemo(() => {
    return Object.entries(expansions).filter(([, expansion]) =>
      renderMode === "homebrew" ? expansion.isHomebrew : !expansion.isHomebrew,
    );
  }, [expansions, renderMode]);

  const { t } = useTranslation();

  return (
    <>
      {renderMode === "homebrew" && filteredExpansions.length > 0 && (
        <Typography color="text.secondary" mt={1}>
          {t("ruleset-selector.homebrew-expansions", "Third-Party Expansions")}
        </Typography>
      )}
      {filteredExpansions.map(([expansionKey, expansion]) => (
        <Box key={expansionKey}>
          <FormControlLabel
            key={expansionKey}
            label={expansion.name}
            control={
              <Checkbox
                checked={
                  activeRulesetConfig[rulesetKey]
                    ? (activeExpansionConfig[rulesetKey]?.[expansionKey] ??
                      false)
                    : false
                }
              />
            }
            onChange={(_, checked) =>
              onExpansionChange(rulesetKey, expansionKey, checked)
            }
            disabled={!activeRulesetConfig[rulesetKey]} // Disable if the ruleset is not active
          />
          <LicenseInfo packageConfig={expansion} />
          {defaultPlaysets[expansion.id] && (
            <Collapse in={activeExpansionConfig[rulesetKey]?.[expansionKey]}>
              <Box ml={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">
                    {t(
                      "game.playset.default",
                      "Apply a default playset (optional)",
                    )}
                  </Typography>
                  <Tooltip title={defaultPlaysets[expansion.id].info}>
                    <InfoIcon color="info" />
                  </Tooltip>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                  {defaultPlaysets[expansion.id].playsets.map(
                    (defaultPlayset, index) => (
                      <Chip
                        icon={
                          activePlaysetConfig === defaultPlayset.playset ? (
                            <SelectedIcon />
                          ) : undefined
                        }
                        key={index}
                        label={defaultPlayset.label}
                        onClick={() => onPlaysetChange(defaultPlayset.playset)}
                      />
                    ),
                  )}
                </Box>
              </Box>
            </Collapse>
          )}
        </Box>
      ))}
    </>
  );
}
