import { ElementType, ReactNode } from "react";

import { css } from "styled-system/css";

import { Select } from "../../components/Select";
import { Clock } from "../Clock";
import { RollButton } from "../RollButton";
import { CompleteButton } from "./CompleteButton";
import type { TracksPanelStrings } from "./tracksPanelStrings";
import {
  ClockTrackItem,
  OracleOdds,
  oracleOddsOrder,
} from "./tracksPanelTypes";

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
