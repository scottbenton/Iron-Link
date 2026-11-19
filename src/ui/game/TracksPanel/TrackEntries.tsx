import { CheckCircleIcon } from "@phosphor-icons/react";
import { ElementType, ReactNode } from "react";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { Select } from "../../components/Select";
import { Clock } from "../Clock";
import { ProgressRank, ProgressTrack } from "../ProgressTrack";
import { RollButton } from "../RollButton";
import type { TracksPanelStrings } from "./tracksPanelStrings";
import {
  ClockTrackItem,
  OracleOdds,
  ProgressTrackItem,
  TrackMove,
  oracleOddsOrder,
} from "./tracksPanelTypes";

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

/**
 * The odds and Roll Progress sit side by side at their own widths, so the
 * button stays lighter than the clock above it.
 */
const clockActionsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  width: "100%",
});

/**
 * The odds select is as wide as its value, up to about the width of its
 * longest ("Odds: Almost Certain"), and never stretches across a wide
 * panel. On a narrow one it shrinks and its value ends in an ellipsis.
 */
const clockOddsStyles = css({
  flex: "0 1 auto",
  minWidth: 0,
  maxWidth: "13rem",
});

/** Complete sits at the end of the actions row, after the rolls. */
const completeStyles = css({ marginInlineStart: "auto" });

function CompleteButton(props: {
  label: string;
  onClick: () => void;
  strings: TracksPanelStrings;
}) {
  const { label, onClick, strings } = props;
  return (
    <Button
      size="sm"
      variant="ghost"
      className={completeStyles}
      startIcon={<CheckCircleIcon />}
      aria-label={strings.completeLabel(label)}
      onClick={onClick}
    >
      {strings.completeShort}
    </Button>
  );
}

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

export interface ClockEntryProps {
  clock: ClockTrackItem;
  editable: boolean;
  menu: ReactNode;
  onValueChange?: (value: number) => void;
  onRoll?: () => void;
  onOddsChange?: (odds: OracleOdds) => void;
  /** Shows Complete after Roll Progress while the clock is open. */
  onComplete?: () => void;
  titleAs?: ElementType;
  strings: TracksPanelStrings;
}

/**
 * A clock: the clock card, its dial the control, and beside the dial its
 * odds, Roll Progress (which asks the oracle whether the clock advances)
 * and Complete.
 */
export function ClockEntry(props: ClockEntryProps) {
  const {
    clock,
    editable,
    menu,
    onValueChange,
    onRoll,
    onOddsChange,
    onComplete,
    titleAs,
    strings,
  } = props;
  const active = editable && !clock.completed;
  const odds = clock.odds ?? "likely";
  const full = clock.value >= clock.segments;

  return (
    <Clock
      presentation="card"
      label={clock.label}
      typeLabel={strings.kindLabels.clock}
      description={clock.description}
      segments={clock.segments}
      value={clock.value}
      completed={clock.completed}
      onChange={editable ? onValueChange : undefined}
      headerAction={menu}
      titleAs={titleAs}
      actions={
        active &&
        (onRoll || onOddsChange || onComplete) && (
          <div className={clockActionsStyles}>
            {onOddsChange && (
              <Select<OracleOdds>
                className={clockOddsStyles}
                size="sm"
                aria-label={strings.oddsLabel(clock.label)}
                value={odds}
                onValueChange={(value) => value && onOddsChange(value)}
                options={oracleOddsOrder.map((value) => ({
                  value,
                  label: strings.oddsLabels[value],
                }))}
                renderValue={(value) =>
                  `${strings.odds}: ${strings.oddsLabels[value as OracleOdds]}`
                }
              />
            )}
            {onRoll && (
              <RollButton
                size="sm"
                aria-label={strings.rollProgressLabel(clock.label)}
                disabled={full}
                onClick={onRoll}
              >
                {strings.rollProgress}
              </RollButton>
            )}
            {onComplete && (
              <CompleteButton
                label={clock.label}
                onClick={onComplete}
                strings={strings}
              />
            )}
          </div>
        )
      }
    />
  );
}
