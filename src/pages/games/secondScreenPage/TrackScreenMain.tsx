import { Box, Typography } from "@mui/material";
import { useMemo } from "react";

import { ClockCircle } from "components/datasworn/Clocks/ClockCircle";
import { ProgressTrackTick } from "components/datasworn/ProgressTrack/ProgressTrackTick";

import { useTracksStore } from "stores/tracks.store";

import { TrackTypes } from "repositories/tracks.repository";

interface TrackScreenMainProps {
  trackId: string;
}
export function TrackScreenMain(props: TrackScreenMainProps) {
  const { trackId } = props;

  const track = useTracksStore((store) => store.tracks[trackId]);
  const completedTicks = track.type !== TrackTypes.Clock ? track.value : 0;

  const checks = useMemo(() => {
    const checks: number[] = [];

    let checksIndex = 0;
    let checksValue = 0;

    for (let i = 0; i <= 40; i++) {
      if (i % 4 === 0 && i !== 0) {
        checks[checksIndex] = checksValue;
        checksIndex++;
        checksValue = 0;
      }

      if (i < completedTicks) {
        checksValue++;
      }
    }

    return checks;
  }, [completedTicks]);

  if (!track) {
    return null;
  }

  return (
    <Box
      px={2}
      pb={8}
      gap={4}
      flexGrow={1}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent={"center"}
    >
      <Typography variant="h3" fontFamily={"fontFamilyTitle"}>
        {track.label}
      </Typography>
      <Box display="flex" alignItems="center" gap={2}>
        {track.type !== TrackTypes.Clock && (
          <Box
            display={"flex"}
            bgcolor={(theme) => theme.palette.background.paper}
            color={(theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[600]
                : theme.palette.grey[300]
            }
            borderRadius={1}
            border={4}
            borderColor={"text.secondary"}
            role={"meter"}
          >
            {checks.map((value, index) => (
              <Box
                key={index}
                sx={{
                  borderLeft: index !== 0 ? 4 : 0,
                  borderStyle: "solid",
                  borderTop: 0,
                  borderBottom: 0,
                  borderRight: 0,
                  borderLeftColor: "text.secondary",
                }}
              >
                <ProgressTrackTick
                  value={value}
                  key={index}
                  aria-hidden
                  size={48}
                />
              </Box>
            ))}
          </Box>
        )}
        {(track.type === TrackTypes.Clock ||
          track.type === TrackTypes.SceneChallenge) && (
          <ClockCircle
            segments={track.type === TrackTypes.Clock ? track.segments : 4}
            value={
              track.type === TrackTypes.Clock
                ? track.value
                : track.segmentsFilled
            }
            size={track.type === TrackTypes.Clock ? "large" : "medium"}
          />
        )}
      </Box>
    </Box>
  );
}
