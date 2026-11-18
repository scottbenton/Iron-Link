import { CSSProperties } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { StatCard } from "./StatCard";

/**
 * The container the grid measures. Its width comes from its parent, so in a
 * flex row give it a width or `flex: 1`.
 */
const containerStyles = css({
  containerType: "inline-size",
  containerName: "stat-grid",
  // Wide rooms stop growing the cards at 84px each.
  maxWidth:
    "calc(var(--stat-count, 5) * var(--stat-max-width, 84px) + (var(--stat-count, 5) - 1) * var(--stat-gap, 6px))",
});

/*
 * Columns by count and width. A row of n cards needs n * 60px plus 6px gaps
 * (66n - 6). Narrower than that, the cards wrap into rows that differ by at
 * most one, never leaving one card alone: 4 as 2 + 2, 5 as 3 + 2, 6 as
 * 3 + 3, 7 as 4 + 3, 8 as 4 + 4. Queries cannot read custom properties, so
 * the widths are written out for the 60px minimum and 6px gap, and the
 * ranges never overlap, so their order in the stylesheet does not matter.
 *
 *   width      | 2 | 3 | 4 | 5     | 6     | 7, 8
 *   < 126      | 1 | 1 | 1 | 1     | 1     | 1
 *   126 to 191 | 2 | 1 | 2 | 2 (*) | 2     | 2
 *   192 to 257 | 2 | 3 | 2 | 3     | 3     | 2
 *   258 to 323 | 2 | 3 | 4 | 3     | 3     | 4
 *   324 to 389 |   |   |   | 5     | 3     | 4
 *   390 to 521 |   |   |   |       | 6     | 4 (7 is one row from 456)
 *
 * (*) Below 192px five cards go 2 + 2 + 1; no column count avoids a lone
 * card there short of one column. No sidebar is that narrow.
 */
const gridStyles = css({
  "--stat-gap": "6px",
  display: "grid",
  // Any other count: as many columns as fit at the cards' minimum width.
  gridTemplateColumns:
    "repeat(auto-fit, minmax(var(--stat-min-width, 60px), 1fr))",
  gap: "var(--stat-gap)",
  // 2 to 8 cards: one row while it fits, else the even rows above. The
  // count is `--stat-count`; the queries set `--stat-columns`, and the
  // `columns` prop sets it inline.
  "&[data-count], &[data-columns]": {
    gridTemplateColumns:
      "repeat(var(--stat-columns, var(--stat-count)), minmax(var(--stat-min-width, 60px), 1fr))",
  },
  "@container stat-grid (max-width: 125.98px)": {
    "&[data-count]": { "--stat-columns": "1" },
  },
  "@container stat-grid (min-width: 126px) and (max-width: 191.98px)": {
    "&[data-count='3']": { "--stat-columns": "1" },
    "&:is([data-count='4'], [data-count='5'], [data-count='6'], [data-count='7'], [data-count='8'])":
      { "--stat-columns": "2" },
  },
  "@container stat-grid (min-width: 192px) and (max-width: 257.98px)": {
    "&:is([data-count='4'], [data-count='7'], [data-count='8'])": {
      "--stat-columns": "2",
    },
    "&:is([data-count='5'], [data-count='6'])": { "--stat-columns": "3" },
  },
  "@container stat-grid (min-width: 258px) and (max-width: 323.98px)": {
    "&:is([data-count='5'], [data-count='6'])": { "--stat-columns": "3" },
    "&:is([data-count='7'], [data-count='8'])": { "--stat-columns": "4" },
  },
  "@container stat-grid (min-width: 324px) and (max-width: 389.98px)": {
    "&[data-count='6']": { "--stat-columns": "3" },
    "&:is([data-count='7'], [data-count='8'])": { "--stat-columns": "4" },
  },
  "@container stat-grid (min-width: 390px) and (max-width: 455.98px)": {
    "&:is([data-count='7'], [data-count='8'])": { "--stat-columns": "4" },
  },
  "@container stat-grid (min-width: 456px) and (max-width: 521.98px)": {
    "&[data-count='8']": { "--stat-columns": "4" },
  },
  margin: 0,
  padding: 0,
  listStyle: "none",
});

const itemStyles = css({ display: "grid", minWidth: 0 });

export interface StatGridStat {
  /** A stable key, such as the Datasworn stat key ("edge"). */
  key: string;
  name: string;
  value: number;
}

export interface StatGridProps extends LayoutProps {
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
   * Fixes the column count. By default the cards keep to one row while it
   * fits, then wrap into even rows (5 as 3 + 2, 4 as 2 + 2, 6 as 3 + 3),
   * chosen from the grid's own width, never the window's.
   */
  columns?: number;
  rollLabel?: string;
  className?: string;
}

/**
 * The five stats (Edge, Heart, Iron, Shadow, Wits) in a row of cards, 60px to
 * 84px wide with 6px between them. Too narrow for all five at 60px (under
 * 324px), the row wraps as 3 + 2, never 4 + 1; four stats wrap as 2 + 2 and
 * six as 3 + 3. The grid measures its own width (a container query), so it
 * wraps the same in a sidebar, a dialog or a phone sheet. Adds show on every
 * card, since they apply to whichever stat is rolled next.
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
  } = withLayoutProps(props);

  const count = stats.length;

  return (
    <div
      className={cx(containerStyles, className)}
      style={{ "--stat-count": columns ?? count } as CSSProperties}
    >
      <ul
        aria-label={label}
        className={gridStyles}
        data-count={!columns && count >= 2 && count <= 8 ? count : undefined}
        data-columns={columns ? "" : undefined}
        style={
          columns ? ({ "--stat-columns": columns } as CSSProperties) : undefined
        }
      >
        {stats.map((stat) => (
          <li key={stat.key} className={itemStyles}>
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
    </div>
  );
}
