import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { RulesPackageSelector } from "components/datasworn/RulesPackageSelector";

import { useGameStore } from "stores/game.store";

import { ExpansionConfig, RulesetConfig } from "repositories/game.repository";

import { useGameIdOptional } from "../../gamePageLayout/hooks/useGameId";

export interface GameRulesetChooserDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GameRulesetChooserDialog(props: GameRulesetChooserDialogProps) {
  const { open, onClose } = props;
  const { t } = useTranslation();

  const gameId = useGameIdOptional();
  const { error } = useSnackbar();

  const initialRulesets = useGameStore((store) => store.game?.rulesets);
  const initialExpansions = useGameStore((store) => store.game?.expansions);
  const [rulesets, setRulesets] = useState<RulesetConfig>(
    initialRulesets ?? {},
  );
  const [expansions, setExpansions] = useState<ExpansionConfig>(
    initialExpansions ?? {},
  );

  useEffect(() => {
    setRulesets(initialRulesets ?? {});
  }, [initialRulesets]);
  useEffect(() => {
    setExpansions(initialExpansions ?? {});
  }, [initialExpansions]);

  const updateRulesPackages = useGameStore(
    (store) => store.updateGameRulesPackages,
  );

  const handleSave = useCallback(() => {
    if (gameId) {
      if (Object.values(rulesets).some((isActive) => isActive)) {
        updateRulesPackages(gameId, rulesets, expansions)
          .then(() => {
            onClose();
          })
          .catch(() => {});
      } else {
        error(
          t("game.overview-sidebar.no-ruleset-selected", "No ruleset selected"),
        );
      }
    }
  }, [rulesets, expansions, onClose, error, t, gameId, updateRulesPackages]);

  return (
    <Dialog open={open && !!gameId} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("game.overview-sidebar.change-ruleset", "Change Game Ruleset")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <RulesPackageSelector
          activeRulesetConfig={rulesets}
          activeExpansionConfig={expansions}
          onRulesetChange={(rulesetKey, isActive) =>
            setRulesets((prev) => ({ ...prev, [rulesetKey]: isActive }))
          }
          onExpansionChange={(rulesetKey, expansionKey, isActive) =>
            setExpansions((prev) => ({
              ...prev,
              [rulesetKey]: {
                ...prev[rulesetKey],
                [expansionKey]: isActive,
              },
            }))
          }
        />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button color="primary" onClick={handleSave}>
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
