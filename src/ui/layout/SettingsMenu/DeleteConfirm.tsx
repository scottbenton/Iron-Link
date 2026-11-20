import { useState } from "react";

import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PendingDelete } from "./settingsMenuProps";
import { SettingsMenuGame } from "./settingsMenuSections";
import { SettingsMenuStrings } from "./settingsMenuStrings";

interface DeleteConfirmProps {
  pending: PendingDelete;
  onDone: () => void;
  strings: SettingsMenuStrings;
  characterName?: string;
  game?: SettingsMenuGame;
  onDeleteCharacter?: () => void;
  onDeleteGame?: () => void;
}

/** The confirm behind each Delete, in the danger tone (Cancel focused). */
export function DeleteConfirm(props: DeleteConfirmProps) {
  const {
    pending,
    onDone,
    strings,
    characterName = "",
    game,
    onDeleteCharacter,
    onDeleteGame,
  } = props;
  // Keep the last question while the dialog closes, so its text holds.
  const [shown, setShown] = useState<PendingDelete>(pending);
  if (pending && pending !== shown) setShown(pending);

  const isGame = shown === "game";
  return (
    <ConfirmDialog
      open={pending !== null}
      tone="danger"
      title={
        isGame
          ? strings.deleteGameTitle(game?.name ?? "")
          : strings.deleteCharacterTitle(characterName)
      }
      description={
        isGame
          ? strings.deleteGameDescription(game?.solo ?? false)
          : strings.deleteCharacterDescription
      }
      confirmationText={isGame ? strings.deleteGame : strings.deleteCharacter}
      cancellationText={isGame ? strings.keepGame : strings.keepCharacter}
      closeLabel={strings.closeLabel}
      onCancel={onDone}
      onConfirm={() => {
        onDone();
        if (isGame) onDeleteGame?.();
        else onDeleteCharacter?.();
      }}
    />
  );
}
