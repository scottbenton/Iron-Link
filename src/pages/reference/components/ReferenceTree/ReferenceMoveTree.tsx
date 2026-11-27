import { useCallback } from "react";

import { LinkComponent } from "components/LinkComponent";
import {
  DataswornMoveTree,
  DataswornMoveTreeProps,
  RenderMoveRow,
} from "components/datasworn/DataswornTree";

import { MoveListItem } from "ui/game/MoveListItem";

import { getReferenceItemHref } from "../../data/referencePaths";

export type ReferenceMoveTreeProps = Omit<DataswornMoveTreeProps, "renderMove">;

// The reference's list of moves, every move a link to its page.
export function ReferenceMoveTree(props: ReferenceMoveTreeProps) {
  const renderMove = useCallback<RenderMoveRow>(
    (move, { current }) => (
      <MoveListItem
        move={move}
        render={<LinkComponent href={getReferenceItemHref(move._id) ?? ""} />}
        current={current}
      />
    ),
    [],
  );
  return <DataswornMoveTree {...props} renderMove={renderMove} />;
}
