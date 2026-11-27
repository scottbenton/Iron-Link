import { ElementType, ReactNode } from "react";
import { useTranslation } from "react-i18next";

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
 * The odds take a line of their own, so Roll Progress and Complete stay put
 * under them whichever odds are picked, and the buttons stay lighter than
 * the clock above them.
 */
const clockActionsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  width: "100%",
});

const clockOddsRowStyles = css({
  flex: "1 0 100%",
  display: "flex",
  minWidth: 0,
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
 * odds on their own line, then Roll Progress (which asks the oracle whether
 * the clock advances) and Complete.
 */
export function ClockEntry(props: ClockEntryProps) {
  const { t } = useTranslation();
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
              <div className={clockOddsRowStyles}>
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
                    t("ui.common.label-value", "{{label}}: {{value}}", {
                      label: strings.odds,
                      value: strings.oddsLabels[value as OracleOdds],
                    })
                  }
                />
              </div>
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
