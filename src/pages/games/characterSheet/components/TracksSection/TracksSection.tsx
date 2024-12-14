import { Box, LinearProgress } from "@mui/material";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useCampaignPermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { GamePermission } from "stores/game.store";
import { useTracksStore } from "stores/tracks.store";

import { TrackStatus } from "repositories/tracks.repository";

import { TrackItem } from "./TrackItem";
import { TracksSectionHeader } from "./TracksSectionHeader";

export function TracksSection() {
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

  const canEdit =
    useCampaignPermissions().gamePermission !== GamePermission.Viewer;

  return (
    <>
      <TracksSectionHeader showCompletedTracks={showCompletedTracks} />
      {areTracksLoading && <LinearProgress />}
      <Box
        display="flex"
        flexDirection="column"
        pt={2}
        gap={4}
        alignItems="flex-start"
      >
        {sortedTrackIds.map((trackId) => (
          <TrackItem
            key={trackId}
            gameId={campaignId}
            canEdit={canEdit}
            trackId={trackId}
          />
        ))}
      </Box>
    </>
  );
}
