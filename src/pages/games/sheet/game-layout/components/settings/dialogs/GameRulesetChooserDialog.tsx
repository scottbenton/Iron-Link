import { Dialog } from "@/components/common/Dialog";
import { RulesPackageSelector } from "@/components/datasworn/RulesPackageSelector";
import { toaster } from "@/components/ui/toaster";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameIdOptional } from "@/hooks/useGameId";
import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "@/repositories/game.repository";
import { useGameStore } from "@/stores/game.store";
import { Button } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

export interface GameRulesetChooserDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GameRulesetChooserDialog(props: GameRulesetChooserDialogProps) {
  const { open, onClose } = props;
  const t = useGameTranslations();

  const gameId = useGameIdOptional();

  const initialRulesets = useGameStore((store) => store.game?.rulesets);
  const initialExpansions = useGameStore((store) => store.game?.expansions);
  const initialPlayset = useGameStore((store) => store.game?.playset);

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

  const handleSave = useCallback(() => {
    if (gameId) {
      if (Object.values(rulesets).some((isActive) => isActive)) {
        updateRulesPackages(gameId, rulesets, expansions, playset)
          .then(() => {
            onClose();
          })
          .catch(() => {});
      } else {
        toaster.error({
          description: t(
            "game.overview-sidebar.no-ruleset-selected",
            "No ruleset selected",
          ),
        });
      }
    }
  }, [rulesets, expansions, playset, onClose, t, gameId, updateRulesPackages]);

  return (
    <Dialog
      open={open && !!gameId}
      onClose={onClose}
      title={t("game.overview-sidebar.change-ruleset", "Change Game Ruleset")}
      content={
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
      }
      actions={
        <>
          <Button colorPalette="gray" variant="ghost" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave}>
            {t("common.save-changes", "Save Changes")}
          </Button>
        </>
      }
    />
  );
}
