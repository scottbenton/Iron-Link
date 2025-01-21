import RollIcon from "@mui/icons-material/Casino";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useMove } from "hooks/datasworn/useMove";

import { TrackTypes } from "repositories/tracks.repository";

export interface TrackCompletionMoveButtonProps {
  moveId: string;
  trackType: TrackTypes;
  trackLabel: string;
  trackProgress: number;
}

export function TrackCompletionMoveButton(
  props: TrackCompletionMoveButtonProps,
) {
  const { moveId, trackType, trackLabel, trackProgress } = props;
  const { t } = useTranslation();

  const move = useMove(moveId);

  const rollCompleteProgressTrack = useRollCompleteProgressTrack();

  if (!move) {
    return null;
  }

  return (
    <Button
      variant="outlined"
      color="inherit"
      endIcon={<RollIcon />}
      onClick={() =>
        rollCompleteProgressTrack(trackType, trackLabel, trackProgress, moveId)
      }
      sx={{ mt: 1 }}
    >
      {t(
        "character.character-sidebar.tracks-progress-track-completion-roll",
        "Roll {{moveName}}",
        { moveName: move.name },
      )}
    </Button>
  );
}
