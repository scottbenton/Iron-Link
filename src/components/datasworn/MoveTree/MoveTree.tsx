import { useCallback } from "react";

import {
  DataswornMoveTree,
  RenderMoveRow,
} from "components/datasworn/DataswornTree";

import { MoveListItem } from "ui/game/MoveListItem";
import { Box } from "ui/primitives";

import { Move } from "../Move";

// The game's list of moves. A move opens in place with its rolls, text and
// tables.
export function MoveTree() {
  const renderMove = useCallback<RenderMoveRow>(
    (move) => (
      <MoveListItem move={move}>
        <Move moveId={move._id} />
      </MoveListItem>
    ),
    [],
  );
  return (
    <Box padding="3">
      <DataswornMoveTree renderMove={renderMove} />
    </Box>
  );
}
