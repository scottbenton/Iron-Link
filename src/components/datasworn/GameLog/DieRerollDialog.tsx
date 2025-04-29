import { D6Icon } from "@/assets/D6Icon";
import { D10Icon } from "@/assets/D10Icon";
import { Dialog } from "@/components/common/Dialog";
import { toaster } from "@/components/ui/toaster";
import { DEFAULT_MOMENTUM } from "@/data/constants";
import { useMove } from "@/hooks/datasworn/useMove";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { getRoll } from "@/hooks/useRollStatAndAddToLog";
import { RollResult } from "@/repositories/shared.types";
import { IStatRoll } from "@/services/gameLog.service";
import { useGameCharacter } from "@/stores/gameCharacters.store";
import { useGameLogStore } from "@/stores/gameLog.store";
import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

import { GameLogCard } from "./GameLogCard";

export interface DieRerollDialogProps {
  open: boolean;
  handleClose: () => void;
  roll: IStatRoll;
}

export function DieRerollDialog(props: DieRerollDialogProps) {
  const { open, handleClose, roll } = props;

  const t = useDataswornTranslations();
  const momentum = useGameCharacter(
    (character) => character?.momentum ?? DEFAULT_MOMENTUM,
  );

  const [loading, setLoading] = useState(false);

  const [action, setAction] = useState(roll.action);
  const [challenge1, setChallenge1] = useState(roll.challenge1);
  const [challenge2, setChallenge2] = useState(roll.challenge2);

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
    // Strong Hit
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

  const handleRoll = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    dieSides: number,
    dieLabel: string,
  ) => {
    const roll = getRoll(dieSides);
    setter(roll);
    toaster.create({
      type: "info",
      title: t(
        "game.log.reroll-dialog.rerolled",
        "Rerolled {{label}} die for a new value of {{roll}}",
        {
          label: dieLabel,
          roll,
        },
      ),
    });
  };

  const setGameLog = useGameLogStore((store) => store.setGameLog);
  const handleSave = () => {
    setLoading(true);
    setGameLog(roll.id, updatedRoll)
      .then(() => {
        setLoading(false);
        handleClose();
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const move = useMove(roll.moveId);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={t("game.log.reroll-dialog.title", "Reroll {{label}}", {
        label: move ? move.name : roll.rollLabel,
      })}
      content={
        <>
          <Stack
            gap={2}
            css={{
              "&>div": {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "sm",
                bg: "bg.muted",
                px: 1,
                py: 1,
                "&>div": {
                  display: "flex",
                  alignItems: "center",
                  "& svg": {
                    color: "fg.muted",
                  },
                },
              },
            }}
          >
            <Box>
              <Box>
                <D6Icon />
                <Text fontSize={"lg"} as={"span"} ml={1}>
                  {action}
                </Text>
              </Box>
              <Button
                colorPalette="gray"
                variant="subtle"
                onClick={() => handleRoll(setAction, 6, "action")}
              >
                {t("game.log.reroll-dialog.reroll", "Reroll")}
              </Button>
            </Box>
            <Box>
              <Box>
                <D10Icon />
                <Text fontSize={"lg"} as={"span"} ml={2}>
                  {challenge1}
                </Text>
              </Box>
              <Button
                colorPalette="gray"
                variant="subtle"
                onClick={() => handleRoll(setChallenge1, 10, "challenge")}
              >
                {t("game.log.reroll-dialog.reroll", "Reroll")}
              </Button>
            </Box>
            <Box>
              <Box>
                <D10Icon />
                <Text fontSize={"lg"} as="span" ml={2}>
                  {challenge2}
                </Text>
              </Box>
              <Button
                colorPalette="gray"
                variant="subtle"
                onClick={() => handleRoll(setChallenge2, 10, "challenge")}
              >
                {t("game.log.reroll-dialog.reroll", "Reroll")}
              </Button>
            </Box>
          </Stack>
          <Box mt={4}>
            <Text fontSize={"lg"}>Result</Text>
            <GameLogCard log={updatedRoll} />
          </Box>
        </>
      }
      actions={
        <>
          <Button
            colorPalette={"gray"}
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave} loading={loading}>
            {t("game.log.reroll-dialog-save", "Save Roll")}
          </Button>
        </>
      }
    />
  );
}
