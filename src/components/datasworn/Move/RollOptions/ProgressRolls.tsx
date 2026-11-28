import { Stack } from "ui/primitives";

import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useTracksStore } from "stores/tracks.store";

import { getProgressRank } from "lib/progressTrack.lib";

import { TrackStatus, TrackTypes } from "repositories/tracks.repository";

import { TrackRoll } from "./TrackRoll";
import { WorldConnectionRolls } from "./WorldConnectionRolls";

export interface ProgressRollsProps {
  trackType: TrackTypes;
  moveId: string;
  moveName: string;
}

// The game's active tracks of the move's type, newest first, each with its
// roll; for a connection move, the character's world connections first.
export function ProgressRolls(props: ProgressRollsProps) {
  const { trackType, moveId, moveName } = props;
  const rollTrackProgress = useRollCompleteProgressTrack();

  const tracks = useTracksStore((store) =>
    Object.entries(store.tracks)
      .filter(
        ([, track]) =>
          track.type === trackType && track.status === TrackStatus.Active,
      )
      .sort(
        ([, t1], [, t2]) => t2.createdDate.getTime() - t1.createdDate.getTime(),
      ),
  );

  return (
    <Stack gap="4">
      {trackType === TrackTypes.BondProgress && (
        <WorldConnectionRolls moveId={moveId} moveName={moveName} />
      )}
      {tracks.map(([trackId, track]) => (
        <TrackRoll
          key={trackId}
          moveName={moveName}
          label={track.label}
          ticks={track.value}
          rank={
            "difficulty" in track
              ? getProgressRank(track.difficulty)
              : undefined
          }
          onRoll={() =>
            rollTrackProgress(track.type, track.label, track.value, moveId)
          }
        />
      ))}
    </Stack>
  );
}
