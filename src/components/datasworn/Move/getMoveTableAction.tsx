import { Datasworn } from "@datasworn-community/core";
import { Box } from "@mui/material";
import { ReactNode } from "react";

import { MoveOracleButton } from "./MoveOracleButton";
import { withoutRulesPackage } from "./getTableIdsRenderedInMarkdown";

/**
 * For MarkdownRenderer's renderTableAction: the roll button for a table the
 * move's text places inline (Pay the Price, Reveal a Danger), drawn above the
 * table. Below it, a screen reader user had to step through every cell before
 * finding the button. Tables that aren't one of the move's own oracles get no
 * button.
 */
export function getMoveTableAction(
  move: Datasworn.AnyMove,
): (tableId: string) => ReactNode {
  const oracles = new Map(
    Object.values(("oracles" in move ? move.oracles : undefined) ?? {}).map(
      (oracle) => [withoutRulesPackage(oracle._id), oracle],
    ),
  );

  return function renderMoveTableAction(tableId: string) {
    const oracle = oracles.get(withoutRulesPackage(tableId));
    if (!oracle) {
      return null;
    }
    return (
      <Box mt={1}>
        <MoveOracleButton oracle={oracle} />
      </Box>
    );
  };
}
