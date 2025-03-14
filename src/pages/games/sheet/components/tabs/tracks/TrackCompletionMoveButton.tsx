import { useMove } from "@/hooks/datasworn/useMove";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { useRollCompleteProgressTrack } from "@/hooks/useRollCompleteProgressTrack";
import { TrackTypes } from "@/repositories/tracks.repository";
import { Button } from "@chakra-ui/react";
import { DicesIcon } from "lucide-react";

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
  const t = useDataswornTranslations();

  const move = useMove(moveId);

  const rollCompleteProgressTrack = useRollCompleteProgressTrack();

  if (!move) {
    return null;
  }

  return (
    <Button
      variant="subtle"
      onClick={() =>
        rollCompleteProgressTrack(trackType, trackLabel, trackProgress, moveId)
      }
    >
      {t(
        "character.character-sidebar.tracks-progress-track-completion-roll",
        "Roll {{moveName}}",
        { moveName: move.name },
      )}
      <DicesIcon />
    </Button>
  );
}
