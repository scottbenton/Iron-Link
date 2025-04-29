import { toaster } from "@/components/ui/toaster";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import { useMomentumParameters } from "@/hooks/useMomentumParameters";
import { useGamePermissions } from "@/hooks/usePermissions";
import { RollResult, RollType } from "@/repositories/shared.types";
import { IGameLog } from "@/services/gameLog.service";
import { useUID } from "@/stores/auth.store";
import { GamePermission } from "@/stores/game.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { useGameLogStore } from "@/stores/gameLog.store";
import { Icon, IconButton, Menu, Span } from "@chakra-ui/react";
import {
  CopyIcon,
  DicesIcon,
  FlameIcon,
  MoreVerticalIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";

import { gameLogToaster } from "../GameLogToaster";
import { DieRerollDialog } from "./DieRerollDialog";
import { convertRollToClipboard } from "./clipboardFormatter";

export interface NormalRollActionsProps {
  roll: IGameLog;
}

async function pasteRich(rich: string, plain: string) {
  if (typeof ClipboardItem !== "undefined") {
    // Shiny new Clipboard API, not fully supported in Firefox.
    // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API#browser_compatibility
    const html = new Blob([rich], { type: "text/html" });
    const text = new Blob([plain], { type: "text/plain" });
    const data = new ClipboardItem({ "text/html": html, "text/plain": text });
    await navigator.clipboard.write([data]);
  } else {
    // Fallback using the deprecated `document.execCommand`.
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#browser_compatibility
    const cb = (e: ClipboardEvent) => {
      e.clipboardData?.setData("text/html", rich);
      e.clipboardData?.setData("text/plain", plain);
      e.preventDefault();
    };
    document.addEventListener("copy", cb);
    document.execCommand("copy");
    document.removeEventListener("copy", cb);
  }
}

export function NormalRollActions(props: NormalRollActionsProps) {
  const { roll } = props;

  const uid = useUID();
  const currentCharacterId = useCharacterIdOptional();

  const momentum = useGameCharacter((character) => character?.momentum ?? 0);
  const momentumResetValue = useMomentumParameters().resetValue;

  const canDeleteLogs =
    useGamePermissions().gamePermission === GamePermission.Guide;

  let isMomentumBurnUseful = false;
  if (roll.type === RollType.Stat && roll.momentumBurned === null) {
    if (
      roll.result === RollResult.Miss &&
      (momentum > roll.challenge1 || momentum > roll.challenge2)
    ) {
      isMomentumBurnUseful = true;
    } else if (
      roll.result === RollResult.WeakHit &&
      momentum > roll.challenge1 &&
      momentum > roll.challenge2
    ) {
      isMomentumBurnUseful = true;
    }
  }

  const [isDieRerollDialogOpen, setIsDieRerollDialogOpen] = useState(false);

  const handleCopyRoll = () => {
    const clipboardData = convertRollToClipboard(roll);

    if (clipboardData) {
      pasteRich(clipboardData.rich, clipboardData.plain)
        .then(() => {
          toaster.create({
            type: "success",
            title: "Copied roll to clipboard.",
          });
        })
        .catch(() => {
          toaster.create({
            type: "error",
            title: "Failed to copy roll.",
          });
        });
    } else {
      toaster.create({
        type: "error",
        title: "Copying this roll type is not supported.",
      });
    }
  };

  const burnMomentumOnLog = useGameLogStore((store) => store.burnMomentumOnLog);
  const setMomentum = useGameCharactersStore(
    (store) => store.updateCharacterMomentum,
  );
  const handleBurnMomentum = () => {
    if (
      currentCharacterId &&
      roll.type === RollType.Stat &&
      momentum &&
      momentumResetValue !== undefined
    ) {
      let newRollResult = RollResult.Miss;
      if (momentum > roll.challenge1 && momentum > roll.challenge2) {
        newRollResult = RollResult.StrongHit;
      } else if (momentum > roll.challenge1 || momentum > roll.challenge2) {
        newRollResult = RollResult.WeakHit;
      }

      const promises: Promise<unknown>[] = [];
      promises.push(burnMomentumOnLog(roll.id, momentum, newRollResult));
      promises.push(setMomentum(currentCharacterId, momentumResetValue));

      Promise.all(promises)
        .catch(() => {})
        .then(() => {
          toaster.create({
            type: "success",
            title: "Burned Momentum",
          });
        });
    }
  };

  const deleteLog = useGameLogStore((store) => store.deleteLog);

  return (
    <>
      <IconButton
        aria-label={"Copy Roll Result"}
        variant="subtle"
        onClick={() => {
          handleCopyRoll();
        }}
      >
        <CopyIcon />
      </IconButton>
      <Menu.Root
        onOpenChange={({ open }) => {
          if (open) {
            gameLogToaster.pause(roll.id);
          } else {
            gameLogToaster.resume(roll.id);
          }
        }}
      >
        <Menu.Trigger asChild>
          <IconButton aria-label={"Roll Menu"} variant="subtle">
            <MoreVerticalIcon />
          </IconButton>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value={"copy"} onClick={handleCopyRoll}>
              <Icon asChild>
                <CopyIcon />
              </Icon>
              <Span>Copy Roll Result</Span>
            </Menu.Item>
            {roll.type === RollType.Stat && roll.uid === uid && (
              <Menu.Item
                value="reroll"
                onClick={() => {
                  gameLogToaster.pause(roll.id);
                  setIsDieRerollDialogOpen(true);
                }}
              >
                <Icon asChild>
                  <DicesIcon />
                </Icon>
                <Span>Reroll Die</Span>
              </Menu.Item>
            )}
            {roll.type === RollType.Stat &&
              roll.uid === uid &&
              roll.characterId === currentCharacterId &&
              isMomentumBurnUseful && (
                <Menu.Item value="burn-momentum" onClick={handleBurnMomentum}>
                  <Icon asChild>
                    <FlameIcon />
                  </Icon>
                  <Span>Burn Momentum</Span>
                </Menu.Item>
              )}
            {canDeleteLogs && (
              <Menu.Item
                value="delete"
                onClick={() => {
                  gameLogToaster.resume(roll.id);
                  gameLogToaster.dismiss(roll.id);
                  deleteLog(roll.id).catch(() => {});
                }}
              >
                <Icon>
                  <TrashIcon />
                </Icon>
                <Span>Delete Roll</Span>
              </Menu.Item>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
      {roll.type === RollType.Stat && (
        <DieRerollDialog
          open={isDieRerollDialogOpen}
          handleClose={() => {
            gameLogToaster.resume(roll.id);
            setIsDieRerollDialogOpen(false);
          }}
          roll={roll}
        />
      )}
    </>
  );
}
