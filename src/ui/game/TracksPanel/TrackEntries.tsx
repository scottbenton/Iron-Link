import { ElementType, ReactNode } from "react";

import { css } from "styled-system/css";

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

const clockActionsStyles = css({
  display: "grid",
  gap: "2",
  justifyItems: "stretch",
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
  titleAs?: ElementType;
  rankLabels?: Partial<Record<ProgressRank, string>>;
  strings: TracksPanelStrings;
}

/**
 * A vow, journey, fight or scene challenge: its card with minus and plus,
 * the completion roll under the boxes (Fulfill Your Vow and the like) and,
 * for a scene challenge, its tension clock.
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
    titleAs,
    rankLabels,
    strings,
  } = props;
  const active = editable && !track.completed;
  const rolls = active && onRollMove ? moves : [];
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
        (tension || rolls.length > 0) && (
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
  titleAs?: ElementType;
  strings: TracksPanelStrings;
}

/**
 * A clock: the clock card with minus and plus, and beside the dial its odds
 * and Roll Progress, which asks the oracle whether the clock advances.
 */
export function ClockEntry(props: ClockEntryProps) {
  const {
    clock,
    editable,
    menu,
    onValueChange,
    onRoll,
    onOddsChange,
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
        (onRoll || onOddsChange) && (
          <div className={clockActionsStyles}>
            {onOddsChange && (
              <Select<OracleOdds>
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
                fullWidth
                aria-label={strings.rollProgressLabel(clock.label)}
                disabled={full}
                onClick={onRoll}
              >
                {strings.rollProgress}
              </RollButton>
            )}
          </div>
        )
      }
    />
  );
}
