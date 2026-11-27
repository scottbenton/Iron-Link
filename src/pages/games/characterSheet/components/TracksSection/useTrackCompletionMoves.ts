import { useMemo } from "react";

import type { ProgressTrackKind, TrackMove } from "ui/game/TracksPanel";

import { findMove } from "hooks/datasworn/useMove";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { trackCompletionMoveIds } from "./common";
import { typeByKind } from "./trackMappings";

const progressKinds: ProgressTrackKind[] = [
  "vow",
  "journey",
  "combat",
  "sceneChallenge",
];

/**
 * The moves each kind of track rolls to finish, such as Fulfill Your Vow,
 * from the game's rulesets: a kind whose move the rulesets lack offers none.
 */
export function useTrackCompletionMoves() {
  const moves = useDataswornTreeStore((store) => store.moves);

  return useMemo(
    () =>
      Object.fromEntries(
        progressKinds.map((kind) => [
          kind,
          (trackCompletionMoveIds[typeByKind[kind]] ?? []).flatMap(
            (moveId): TrackMove[] => {
              const move = findMove(moves, moveId);
              return move ? [{ id: moveId, name: move.name }] : [];
            },
          ),
        ]),
      ) as Record<ProgressTrackKind, TrackMove[]>,
    [moves],
  );
}
