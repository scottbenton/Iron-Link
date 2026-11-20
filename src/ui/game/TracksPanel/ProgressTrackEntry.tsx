import { ElementType, ReactNode } from "react";

import { css } from "styled-system/css";

import { Clock } from "../Clock";
import { ProgressRank, ProgressTrack } from "../ProgressTrack";
import { RollButton } from "../RollButton";
import { CompleteButton } from "./CompleteButton";
import type { TracksPanelStrings } from "./tracksPanelStrings";
import { ProgressTrackItem, TrackMove } from "./tracksPanelTypes";

const tensionStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  marginInlineEnd: "2",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
});

export interface ProgressTrackEntryProps {
  track: ProgressTrackItem;
  /** Marks, rolls and changes the tension. */
  editable: boolean;
  menu: ReactNode;
  moves: TrackMove[];
  onTicksChange?: (ticks: number) => void;
  onTensionChange?: (value: number) => void;
  onRollMove?: (moveId: string) => void;
  /** Shows Complete at the end of the actions while the track is open. */
  onComplete?: () => void;
  titleAs?: ElementType;
  rankLabels?: Partial<Record<ProgressRank, string>>;
  strings: TracksPanelStrings;
}

/**
 * A vow, journey, fight or scene challenge: its card with minus and plus,
 * then under the boxes its tension clock (a scene challenge), the
 * completion roll (Fulfill Your Vow and the like) and Complete.
 */
export function ProgressTrackEntry(props: ProgressTrackEntryProps) {
  const {
    track,
    editable,
    menu,
    moves,
    onTicksChange,
    onTensionChange,
    onRollMove,
    onComplete,
    titleAs,
    rankLabels,
    strings,
  } = props;
  const active = editable && !track.completed;
  const rolls = active && onRollMove ? moves : [];
  const complete = active && onComplete && (
    <CompleteButton
      label={track.label}
      onClick={onComplete}
      strings={strings}
    />
  );
  const tension = track.kind === "sceneChallenge" && (
    <span className={tensionStyles}>
      <Clock
        label={strings.tensionLabel(track.label)}
        segments={4}
        value={track.tension ?? 0}
        onChange={active ? onTensionChange : undefined}
        size="sm"
        hideLabel
      />
      <span aria-hidden>{strings.tension}</span>
    </span>
  );

  return (
    <ProgressTrack
      label={track.label}
      typeLabel={strings.kindLabels[track.kind]}
      rank={track.rank}
      ticks={track.ticks}
      description={track.description}
      completed={track.completed}
      onChange={editable ? onTicksChange : undefined}
      headerAction={menu}
      titleAs={titleAs}
      rankLabels={rankLabels}
      actions={
        (tension || rolls.length > 0 || complete) && (
          <>
            {tension}
            {rolls.map((move) => (
              <RollButton
                key={move.id}
                size="sm"
                aria-label={strings.rollMoveLabel(move.name, track.label)}
                onClick={() => onRollMove?.(move.id)}
              >
                {move.name}
              </RollButton>
            ))}
            {complete}
          </>
        )
      }
    />
  );
}
