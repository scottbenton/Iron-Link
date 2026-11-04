import { Datasworn } from "@datasworn-community/core";
import { Box } from "@mui/material";

import { OracleTable } from "../Oracle/OracleTable";
import { MoveOracleButton } from "./MoveOracleButton";
import {
  getTableIdsRenderedInMarkdown,
  withoutRulesPackage,
} from "./getTableIdsRenderedInMarkdown";

export interface MoveOraclesProps {
  move: Datasworn.AnyMove;
}

/**
 * The oracle tables a move carries, each with its roll button above it.
 *
 * Most moves that carry an oracle place it in their text with a {{table>...}}
 * directive, which MarkdownRenderer draws with its button
 * (getMoveTableAction). Those are left out here, so no table shows twice.
 */
export function MoveOracles(props: MoveOraclesProps) {
  const { move } = props;

  const alreadyRendered = getTableIdsRenderedInMarkdown(move.text);
  const oracles = Object.entries(
    ("oracles" in move ? move.oracles : undefined) ?? {},
  ).filter(
    ([, oracle]) => !alreadyRendered.has(withoutRulesPackage(oracle._id)),
  );

  if (oracles.length === 0) {
    return null;
  }

  return (
    <Box>
      {oracles.map(([key, oracle]) => (
        <Box mt={1} key={key}>
          <MoveOracleButton oracle={oracle} />
          <OracleTable oracle={oracle} />
        </Box>
      ))}
    </Box>
  );
}
