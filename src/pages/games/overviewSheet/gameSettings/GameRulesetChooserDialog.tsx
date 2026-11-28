import deepEqual from "fast-deep-equal";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { RulesPackageSelector } from "components/datasworn/RulesPackageSelector";
import { WorldOracleChangeWarning } from "components/worlds/WorldOracleChangeWarning";

import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
} from "ui/components/Dialog";
import { toast } from "ui/components/Toast";
import { Stack } from "ui/primitives";

import { useGameStore } from "stores/game.store";

import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";

import { useGameIdOptional } from "../../gamePageLayout/hooks/useGameId";

export interface GameRulesetChooserDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Changes the game's rulesets, expansions and playset. */
export function GameRulesetChooserDialog(props: GameRulesetChooserDialogProps) {
  const { open, onClose } = props;
  const { t } = useTranslation();

  const gameId = useGameIdOptional();

  const initialRulesets = useGameStore((store) => store.game?.rulesets);
  const initialExpansions = useGameStore((store) => store.game?.expansions);
  const initialPlayset = useGameStore((store) => store.game?.playset);
  const linkedToWorld = useGameStore((store) => !!store.game?.worldId);

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

  const [saving, setSaving] = useState(false);
  const handleSave = () => {
    if (!gameId || saving) return;
    if (!Object.values(rulesets).some((isActive) => isActive)) {
      toast.error(
        t("game.overview-sidebar.no-ruleset-selected", "No ruleset selected"),
      );
      return;
    }
    setSaving(true);
    updateRulesPackages(gameId, rulesets, expansions, playset)
      .then(() => onClose())
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <Dialog
      open={open && !!gameId}
      onClose={onClose}
      size="md"
      fullScreenOnMobile
      onSubmit={handleSave}
    >
      <DialogHeader
        title={t("game.overview-sidebar.change-ruleset", "Change Game Ruleset")}
      />
      <DialogBody>
        <Stack gap="4">
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
          {/* World fields follow the rules in play, so this can change which
              oracles they roll. */}
          {linkedToWorld && changed && <WorldOracleChangeWarning />}
        </Stack>
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={saving}
          loadingLabel={t("common.saving", "Saving")}
        >
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
