import type { Datasworn } from "@datasworn-community/core";
import {
  CSSProperties,
  ComponentPropsWithoutRef,
  ElementType,
  useEffect,
  useId,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";

import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { RollButton } from "ui/game/RollButton";
import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";

import { css, cx } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import { RulesText } from "../RulesText/RulesText";
import { compactTableStyles } from "../RulesText/rulesTextStyles";
import {
  AnyOracleRollable,
  OracleColumnLabels,
  findRowForRoll,
  formatRollRange,
  getOracleColumnLabels,
  getOracleTextColumns,
  getRowText,
  hasMarkdown,
} from "./oracleTableData";

const rootStyles = css({
  display: "grid",
  gap: "2",
  minWidth: 0,
});

const headerStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "3",
  minWidth: 0,
});

const scrollStyles = css({
  maxWidth: "100%",
  overflowX: "auto",
  // A long table scrolls inside its own box, under a header that stays put,
  // so the name, the Roll button and the column labels never leave view.
  // The box takes the table's border and corners: a table that clips its
  // own overflow would be what its header sticks to, and never stick.
  "&[data-body-scroll]": {
    maxHeight: "var(--oracle-table-max-height)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    outline: "none",
    _focusVisible: focusRing.outset,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "md",
    "& > table": { borderWidth: 0, borderRadius: 0, overflow: "visible" },
    "& thead th": { position: "sticky", top: 0, zIndex: 1 },
  },
});

const tableStyles = css({
  "& td[data-column=roll], & th[data-column=roll]": {
    width: "1%",
    whiteSpace: "nowrap",
    textAlign: "right",
    paddingInlineEnd: "3",
  },
  "& td[data-column=roll]": {
    color: "fg.muted",
    fontVariantNumeric: "tabular-nums",
  },
  "& td > p, & td :is(p, ul, ol)": { margin: 0 },
  // Doubled attribute: outranks the zebra rows' :nth-of-type.
  "& tbody tr[data-rolled][data-rolled] td": {
    background: "accent.soft",
    color: "fg.default",
    fontWeight: "medium",
  },
  "& tbody tr[data-rolled][data-rolled] td[data-column=roll]": {
    color: "accent.fg",
    fontWeight: "bold",
    boxShadow: "inset 3px 0 0 token(colors.accent.solid)",
  },
  // Each roll flashes its row, so rolling the same result again still
  // shows that something happened.
  "& tbody tr[data-rolled] td": {
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "color-mix(in oklab, token(colors.accent.solid) 28%, transparent)",
      opacity: 0,
      animation: "fadeOut 700ms token(easings.out)",
      _reducedMotion: { animation: "none" },
    },
  },
});

const sizeStyles = {
  sm: css({ fontSize: "sm" }),
  md: css({ fontSize: "md" }),
};

export interface OracleTableProps
  extends CssProp,
    Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** A rollable oracle, standalone or embedded in a move or asset. */
  oracle: AnyOracleRollable;
  /** Highlights the row with this id, as the result of a roll. */
  rolledRowId?: string;
  /** Highlights the row whose range holds this number. */
  rolledValue?: number;
  /**
   * Changes on every roll, such as the roll's id or time. A new key flashes
   * the rolled row again, even when the roll lands on the same row.
   */
  rollKey?: string | number;
  /**
   * Caps the table's height, such as "320px": its rows scroll under a
   * header that stays put, and a new roll scrolls its row into view.
   */
  maxHeight?: string;
  /** Shows a Roll button beside the name. */
  onRoll?: () => void;
  /** The Roll button's visible label. The oracle's name follows it for screen readers. */
  rollLabel?: string;
  /** Hides the name, summary and Roll button, leaving the table alone. */
  hideHeader?: boolean;
  /** The element for the oracle's name, so headings nest. An h3 by default. */
  titleAs?: ElementType;
  /** Labels for tables that carry none of their own (column oracles). */
  columnLabels?: Partial<OracleColumnLabels>;
  /** What screen readers hear for the highlighted row. */
  rolledLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * A rollable oracle's table: the roll range and result columns, with the
 * rolled row highlighted. With `onRoll` its header carries a Roll button.
 */
export function OracleTable(props: OracleTableProps) {
  const { t } = useTranslation();
  const {
    oracle,
    rolledRowId,
    rolledValue,
    rollKey,
    maxHeight,
    onRoll,
    rollLabel = t("ui.common.roll", "Roll"),
    hideHeader,
    titleAs = "h3",
    columnLabels,
    rolledLabel = t("ui.oracle-table.rolled", "Rolled"),
    size = "sm",
    className,
    ...rest
  } = withCssProp(props);

  const titleId = useId();
  const rows = oracle.rows as Datasworn.OracleRollableRow[];
  const textColumns = getOracleTextColumns(oracle);
  const labels = getOracleColumnLabels(t, oracle, columnLabels);

  const rolledRow =
    rolledRowId !== undefined
      ? rows.find((row) => row._id === rolledRowId)
      : rolledValue !== undefined
        ? findRowForRoll(rows, rolledValue)
        : undefined;

  const scrollRef = useRef<HTMLDivElement>(null);
  const rolledRowRef = useRef<HTMLTableRowElement>(null);
  const rolledId = rolledRow?._id;

  // Brings the rolled row into the table's own scroll box, below its header.
  // Only the box scrolls, never the page, and only when the table has one.
  useEffect(() => {
    const box = scrollRef.current;
    const row = rolledRowRef.current;
    if (!maxHeight || !box || !row || rolledId === undefined) return;
    const header = box.querySelector("thead");
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const rowTop =
      row.getBoundingClientRect().top - box.getBoundingClientRect().top;
    const visibleHeight = box.clientHeight - headerHeight;
    const target =
      box.scrollTop +
      rowTop -
      headerHeight -
      (visibleHeight - row.offsetHeight) / 2;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    box.scrollTo?.({
      top: Math.max(0, target),
      behavior: reduced ? "auto" : "smooth",
    });
  }, [maxHeight, rolledId, rollKey]);

  const summary = (oracle as { summary?: string }).summary;
  const matchText = oracle.match?.text;

  return (
    <div className={cx(rootStyles, className)} {...rest}>
      {!hideHeader && (
        <>
          <div className={headerStyles}>
            <Text
              as={titleAs}
              id={titleId}
              variant={size === "md" ? "h3" : "h4"}
            >
              {oracle.name}
            </Text>
            {onRoll && (
              <RollButton size="sm" onClick={onRoll}>
                {rollLabel}
                <VisuallyHidden> {oracle.name}</VisuallyHidden>
              </RollButton>
            )}
          </div>
          {summary && <RulesText markdown={summary} size="sm" color="muted" />}
        </>
      )}
      <div
        ref={scrollRef}
        className={scrollStyles}
        data-body-scroll={maxHeight ? "" : undefined}
        // A box that scrolls is a stop for keyboards, named by the table.
        tabIndex={maxHeight ? 0 : undefined}
        role={maxHeight ? "region" : undefined}
        aria-labelledby={maxHeight && !hideHeader ? titleId : undefined}
        aria-label={maxHeight && hideHeader ? oracle.name : undefined}
        style={
          maxHeight
            ? ({ "--oracle-table-max-height": maxHeight } as CSSProperties)
            : undefined
        }
      >
        <table
          className={cx(compactTableStyles, tableStyles, sizeStyles[size])}
          aria-labelledby={hideHeader ? undefined : titleId}
        >
          {hideHeader && (
            <caption className={visuallyHidden()}>{oracle.name}</caption>
          )}
          <thead>
            <tr>
              <th scope="col" data-column="roll">
                {labels.roll}
              </th>
              {textColumns.map((column) => (
                <th key={column} scope="col" data-column={column}>
                  {labels[column]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isRolled = row === rolledRow;
              return (
                <tr
                  // A new roll remounts the rolled row, replaying its flash.
                  key={isRolled ? `${row._id}:${rollKey ?? ""}` : row._id}
                  ref={isRolled ? rolledRowRef : undefined}
                  data-rolled={isRolled || undefined}
                >
                  <td data-column="roll">
                    {formatRollRange(row.roll)}
                    {isRolled && (
                      <VisuallyHidden>, {rolledLabel}</VisuallyHidden>
                    )}
                  </td>
                  {textColumns.map((column) => {
                    const text = getRowText(row, column);
                    return (
                      <td key={column} data-column={column}>
                        {hasMarkdown(text) ? (
                          <RulesText
                            markdown={text}
                            size={size}
                            color="inherit"
                          />
                        ) : (
                          text
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {matchText && !hideHeader && (
        <RulesText markdown={matchText} size="sm" color="muted" />
      )}
    </div>
  );
}
