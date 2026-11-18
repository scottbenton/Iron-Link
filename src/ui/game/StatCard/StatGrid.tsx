import { CSSProperties } from "react";

import { css, cx } from "styled-system/css";

import { StatCard } from "./StatCard";

const gridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(var(--stat-columns, 5), minmax(0, 72px))",
  gap: "6px",
  margin: 0,
  padding: 0,
  listStyle: "none",
});

export interface StatGridStat {
  /** A stable key, such as the Datasworn stat key ("edge"). */
  key: string;
  name: string;
  value: number;
}

export interface StatGridProps {
  stats: StatGridStat[];
  /** Rolls a stat. Without it every card is a static readout. */
  onRoll?: (stat: StatGridStat) => void;
  /** Adds for the next roll, badged on every card. */
  adds?: number;
  /** Shows the cards but blocks rolling, such as while a roll is saving. */
  disabled?: boolean;
  /** Names the list for screen readers, "Stats" by default. */
  label?: string;
  /** Overrides the column count (5 by default). */
  columns?: number;
  rollLabel?: string;
  className?: string;
}

/**
 * The five stats (Edge, Heart, Iron, Shadow, Wits) in one row of cards, each
 * at most 72px wide with 6px between them.
 */
export function StatGrid(props: StatGridProps) {
  const {
    stats,
    onRoll,
    adds,
    disabled,
    label = "Stats",
    columns,
    rollLabel,
    className,
  } = props;

  return (
    <ul
      aria-label={label}
      className={cx(gridStyles, className)}
      style={
        columns ? ({ "--stat-columns": columns } as CSSProperties) : undefined
      }
    >
      {stats.map((stat) => (
        <li key={stat.key} className={css({ display: "grid", minWidth: 0 })}>
          <StatCard
            name={stat.name}
            value={stat.value}
            adds={adds}
            disabled={disabled}
            rollLabel={rollLabel}
            onRoll={onRoll ? () => onRoll(stat) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
