import { useTranslation } from "react-i18next";

import { ProgressRank, ProgressTrack } from "ui/game/ProgressTrack";
import { RollButton } from "ui/game/RollButton";

export interface TrackRollProps {
  moveName: string;
  label: string;
  ticks: number;
  rank?: ProgressRank;
  legacy?: boolean;
  onRoll: () => void;
}

// A track a progress move rolls: its boxes, and the roll under them, named
// with the track so each roll in a list reads apart.
export function TrackRoll(props: TrackRollProps) {
  const { moveName, label, ticks, rank, legacy, onRoll } = props;
  const { t } = useTranslation();

  return (
    <ProgressTrack
      plain
      label={label}
      ticks={ticks}
      rank={rank}
      legacy={legacy}
      actions={
        <RollButton
          size="sm"
          aria-label={t(
            "datasworn.move.roll-track-progress-for",
            "Roll {{moveName}}: {{track}}",
            { moveName, track: label },
          )}
          onClick={onRoll}
        >
          {t("datasworn.move.roll-track-progress", "Roll {{moveName}}", {
            moveName,
          })}
        </RollButton>
      }
    />
  );
}
