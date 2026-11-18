import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import deepEqual from "fast-deep-equal";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { RulesPackageSelector } from "components/datasworn/RulesPackageSelector";
import { useWorldOracleChangesDialog } from "components/worlds/oracleChanges/useWorldOracleChangesDialog";

import { GamePermission, useGameStore } from "stores/game.store";

import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";

import { WorldOracleChangesService } from "services/worldOracleChanges.service";

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
  const initialPlayset = useGameStore((store) => store.game?.playset);
  const worldId = useGameStore((store) => store.game?.worldId ?? undefined);
  // Only Guides choose what the world's fields roll; anyone else saves the
  // rules and the fields follow them.
  const isGuide = useGameStore(
    (store) => store.gamePermissions === GamePermission.Guide,
  );
  const { confirm: confirmOracleChanges, dialog: oracleChangesDialog } =
    useWorldOracleChangesDialog();
  const [saving, setSaving] = useState(false);

  const [rulesets, setRulesets] = useState<RulesetConfig>(
    initialRulesets ?? {},
  );
  const [expansions, setExpansions] = useState<ExpansionConfig>(
    initialExpansions ?? {},
  );
  const [playset, setPlayset] = useState<PlaysetConfig>(initialPlayset ?? {});

  useEffect(() => {
    setRulesets(initialRulesets ?? {});
  }, [initialRulesets]);
  useEffect(() => {
    setExpansions(initialExpansions ?? {});
  }, [initialExpansions]);
  useEffect(() => {
    setPlayset(initialPlayset ?? {});
  }, [initialPlayset]);

  const updateRulesPackages = useGameStore(
    (store) => store.updateGameRulesPackages,
  );

  const changed =
    !deepEqual(rulesets, initialRulesets ?? {}) ||
    !deepEqual(expansions, initialExpansions ?? {}) ||
    !deepEqual(playset, initialPlayset ?? {});

  const handleSave = useCallback(() => {
    if (!gameId) return;
    if (!Object.values(rulesets).some((isActive) => isActive)) {
      error(
        t("game.overview-sidebar.no-ruleset-selected", "No ruleset selected"),
      );
      return;
    }
    if (!worldId || !isGuide || !changed) {
      updateRulesPackages(gameId, rulesets, expansions, playset)
        .then(() => {
          onClose();
        })
        .catch(() => {});
      return;
    }
    // A linked world's fields may roll different oracles under the new
    // rules, so the save goes through the shared oracle changes dialog.
    setSaving(true);
    confirmOracleChanges({
      title: t("game.overview-sidebar.change-ruleset", "Change Game Ruleset"),
      confirmLabel: t("common.save", "Save"),
      loadPreviews: () =>
        WorldOracleChangesService.previewRulesChange(
          worldId,
          {
            rulesets: initialRulesets ?? {},
            expansions: initialExpansions ?? {},
            playset: initialPlayset ?? {},
          },
          { rulesets, expansions, playset },
        ).then((preview) => [preview]),
      save: (changes) =>
        updateRulesPackages(gameId, rulesets, expansions, playset, changes),
    })
      .then((saved) => {
        setSaving(false);
        if (saved) onClose();
      })
      .catch(() => {
        setSaving(false);
      });
  }, [
    rulesets,
    expansions,
    playset,
    initialRulesets,
    initialExpansions,
    initialPlayset,
    onClose,
    error,
    t,
    gameId,
    worldId,
    isGuide,
    changed,
    confirmOracleChanges,
    updateRulesPackages,
  ]);

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
          activePlaysetConfig={playset}
          onPlaysetChange={setPlayset}
        />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button color="primary" onClick={handleSave} disabled={saving}>
          {saving ? t("common.saving", "Saving") : t("common.save", "Save")}
        </Button>
      </DialogActions>
      {oracleChangesDialog}
    </Dialog>
  );
}
