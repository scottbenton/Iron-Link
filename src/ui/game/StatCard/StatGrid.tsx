import { CSSProperties } from "react";

import { css, cx } from "styled-system/css";

import { StatCard } from "./StatCard";

const gridStyles = css({
  "--stat-gap": "6px",
  display: "grid",
  // As many columns as fit at the cards' minimum width, so a narrow sidebar
  // wraps the row (3 and 2) instead of squeezing names under the values.
  gridTemplateColumns:
    "repeat(auto-fit, minmax(var(--stat-min-width, 60px), 1fr))",
  // Wide rooms stop growing the cards at 84px each.
  maxWidth:
    "calc(var(--stat-count, 5) * var(--stat-max-width, 84px) + (var(--stat-count, 5) - 1) * var(--stat-gap))",
  gap: "var(--stat-gap)",
  "&[data-columns]": {
    gridTemplateColumns:
      "repeat(var(--stat-columns), minmax(var(--stat-min-width, 60px), 1fr))",
  },
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
  /**
   * Fixes the column count. By default the row fits as many cards as the
   * room allows at their minimum width, up to one per stat.
   */
  columns?: number;
  rollLabel?: string;
  className?: string;
}

/**
 * The five stats (Edge, Heart, Iron, Shadow, Wits) in a row of cards, 60px to
 * 84px wide with 6px between them. Too narrow for all five at 60px (under
 * 324px), the row wraps. Adds show on every card, since they apply to
 * whichever stat is rolled next.
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
      data-columns={columns ? "" : undefined}
      style={
        {
          "--stat-count": columns ?? stats.length,
          ...(columns ? { "--stat-columns": columns } : {}),
        } as CSSProperties
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
