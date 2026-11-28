import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
} from "ui/components/Dialog";
import { Text } from "ui/components/Text";
import { Die, DieShape } from "ui/game/DiceDisplay";
import { RollCard } from "ui/game/RollCard";
import { Flex, Stack } from "ui/primitives";

import { getRoll } from "pages/games/hooks/useRollStatAndAddToLog";

import { useMove } from "hooks/datasworn/useMove";
import { getRollSummaryNames } from "hooks/useRollSummary";

import { useGameCharacter } from "stores/gameCharacters.store";
import { useGameLogStore } from "stores/gameLog.store";

import { DEFAULT_MOMENTUM } from "data/constants";

import { toRollData } from "lib/rollSummary.lib";

import { RollResult } from "repositories/shared.types";

import { IStatRoll } from "services/gameLog.service";

export interface DieRerollDialogProps {
  open: boolean;
  handleClose: () => void;
  rollId: string;
  roll: IStatRoll;
}

type DieKey = "action" | "challenge1" | "challenge2";

/**
 * Rerolls one or more dice of a saved action roll, showing the new result
 * before it is saved over the old one.
 */
export function DieRerollDialog(props: DieRerollDialogProps) {
  const { open, handleClose, roll, rollId } = props;

  const { t } = useTranslation();
  const momentum = useGameCharacter(
    (character) => character?.momentum ?? DEFAULT_MOMENTUM,
  );

  const { info } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const [dice, setDice] = useState<Record<DieKey, number>>({
    action: roll.action,
    challenge1: roll.challenge1,
    challenge2: roll.challenge2,
  });
  const { action, challenge1, challenge2 } = dice;

  const matchedNegativeMomentum = momentum < 0 && Math.abs(momentum) === action;
  const actionTotal = Math.min(
    10,
    (matchedNegativeMomentum ? 0 : action) +
      (roll.modifier ?? 0) +
      (roll.adds ?? 0),
  );

  let result: RollResult = RollResult.WeakHit;
  if (actionTotal > challenge1 && actionTotal > challenge2) {
    result = RollResult.StrongHit;
  } else if (actionTotal <= challenge1 && actionTotal <= challenge2) {
    result = RollResult.Miss;
  }
  const updatedRoll: IStatRoll = {
    ...roll,
    action,
    challenge1,
    challenge2,
    result,
    matchedNegativeMomentum,
  };

  const dieRows: {
    key: DieKey;
    shape: DieShape;
    sides: number;
    label: string;
    rerolled: (value: number) => string;
  }[] = [
    {
      key: "action",
      shape: "d6",
      sides: 6,
      label: t("game.log.reroll-dialog.action-die", "Action die"),
      rerolled: (value) =>
        t(
          "game.log.reroll-dialog.action-rerolled",
          "Rerolled action die for a new value of {{value}}",
          { value },
        ),
    },
    {
      key: "challenge1",
      shape: "d10",
      sides: 10,
      label: t("game.log.reroll-dialog.challenge-die-1", "First challenge die"),
      rerolled: (value) =>
        t(
          "game.log.reroll-dialog.challenge-rerolled",
          "Rerolled challenge die for a new value of {{value}}",
          { value },
        ),
    },
    {
      key: "challenge2",
      shape: "d10",
      sides: 10,
      label: t(
        "game.log.reroll-dialog.challenge-die-2",
        "Second challenge die",
      ),
      rerolled: (value) =>
        t(
          "game.log.reroll-dialog.challenge-rerolled",
          "Rerolled challenge die for a new value of {{value}}",
          { value },
        ),
    },
  ];

  const rerollDie = (row: (typeof dieRows)[number]) => {
    const value = getRoll(row.sides);
    setDice((current) => ({ ...current, [row.key]: value }));
    info(row.rerolled(value));
  };

  const setGameLog = useGameLogStore((store) => store.setGameLog);
  const handleSave = () => {
    if (loading) return;
    setLoading(true);
    setGameLog(rollId, updatedRoll)
      .then(() => {
        setLoading(false);
        handleClose();
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const move = useMove(roll.moveId ?? "");

  return (
    <Dialog open={open} onClose={handleClose} size="sm" onSubmit={handleSave}>
      <DialogHeader
        title={t("game.log.reroll-dialog.title", "Reroll {{label}}", {
          label: move ? move.name : roll.rollLabel,
        })}
      />
      <DialogBody>
        <Stack as="ul" gap="2" listStyle="none" margin="0" padding="0">
          {dieRows.map((row) => (
            <Flex
              as="li"
              key={row.key}
              align="center"
              justify="space-between"
              gap="3"
              paddingBlock="2"
              paddingInline="3"
              borderRadius="md"
              background="bg.canvas"
            >
              <Flex align="center" gap="3">
                <Die
                  shape={row.shape}
                  kind={row.key === "action" ? "action" : "challenge"}
                  value={dice[row.key]}
                  size="sm"
                />
                <Text variant="bodySm" color="muted">
                  {row.label}
                </Text>
              </Flex>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t(
                  "game.log.reroll-dialog.reroll-die",
                  "Reroll {{die}}",
                  { die: row.label },
                )}
                onClick={() => rerollDie(row)}
              >
                {t("game.log.reroll-dialog.reroll", "Reroll")}
              </Button>
            </Flex>
          ))}
        </Stack>
        <Stack gap="2">
          <Text variant="label" as="h3">
            {t("game.log.reroll-dialog.result", "Result")}
          </Text>
          <RollCard
            roll={toRollData(updatedRoll, getRollSummaryNames(updatedRoll))}
          />
        </Stack>
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={handleClose} disabled={loading}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {t("game.log.reroll-dialog-save", "Save Roll")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
