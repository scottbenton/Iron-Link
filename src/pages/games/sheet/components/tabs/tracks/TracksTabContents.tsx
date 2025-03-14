import { GridLayout } from "@/components/layout/GridLayout";
import { useGameId } from "@/hooks/useGameId";
import { useGamePermissions } from "@/hooks/usePermissions";
import { TrackStatus } from "@/repositories/tracks.repository";
import { GamePermission } from "@/stores/game.store";
import { useTracksStore } from "@/stores/tracks.store";

import { TrackDialogProvider } from "./TrackDialogProvider";
import { TrackItem } from "./TrackItem";
import { TracksSectionHeader } from "./TracksSectionHeader";

export function TracksTabContents() {
  const campaignId = useGameId();

  const showCompletedTracks = useTracksStore(
    (state) => state.showCompletedTracks,
  );

  const areTracksLoading = useTracksStore((state) => state.loading);
  const sortedTrackIds = useTracksStore((state) =>
    Object.keys(state.tracks)
      .sort((a, b) => {
        const tA = state.tracks[a];
        const tB = state.tracks[b];
        return tB.createdDate.getTime() - tA.createdDate.getTime();
      })
      .filter((trackId) => {
        const track = state.tracks[trackId];
        return showCompletedTracks
          ? true
          : track.status !== TrackStatus.Completed;
      }),
  );

  const canEdit = useGamePermissions().gamePermission !== GamePermission.Viewer;

  return (
    <TrackDialogProvider>
      <TracksSectionHeader showCompletedTracks={showCompletedTracks} />
      <GridLayout
        gap={2}
        mx={-2}
        mt={4}
        items={sortedTrackIds}
        renderItem={(trackId: string) => (
          <TrackItem
            key={trackId}
            gameId={campaignId}
            canEdit={canEdit}
            trackId={trackId}
          />
        )}
        minWidth={325}
        loading={areTracksLoading}
      />
    </TrackDialogProvider>
  );
}
