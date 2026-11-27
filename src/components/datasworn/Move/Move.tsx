import { useTranslation } from "react-i18next";

import { RulesText } from "ui/game/RulesText";
import { EmptyState } from "ui/layout";
import { Stack } from "ui/primitives";

import { useMove } from "hooks/datasworn/useMove";

import { MoveOracles } from "./MoveOracles";
import { MoveRollOptions } from "./MoveRollOptions";

export interface MoveProps {
  moveId: string;
  // For pages that offer their own roll controls, like the public reference.
  hideRollOptions?: boolean;
}

// A move's roll options, text and tables. Whatever shows it names the move
// already (a dialog title, a page heading or a list row).
export function Move(props: MoveProps) {
  const { moveId, hideRollOptions } = props;
  const move = useMove(moveId);

  const { t } = useTranslation();

  if (!move) {
    return (
      <EmptyState
        message={t(
          "datasworn.move-not-found",
          "Move with id {{moveId}} could not be found",
          { moveId },
        )}
      />
    );
  }

  return (
    <Stack gap="2">
      {!hideRollOptions && <MoveRollOptions move={move} />}
      <RulesText markdown={move.text} size="sm" />
      <MoveOracles move={move} />
    </Stack>
  );
}
