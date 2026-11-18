import type { Datasworn } from "@datasworn-community/core";
import { ComponentPropsWithoutRef, ElementType, useId } from "react";

import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { RollButton } from "ui/game/RollButton";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

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

const scrollStyles = css({ maxWidth: "100%", overflowX: "auto" });

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
});

const sizeStyles = {
  sm: css({ fontSize: "sm" }),
  md: css({ fontSize: "md" }),
};

export interface OracleTableProps
  extends LayoutProps,
    Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** A rollable oracle, standalone or embedded in a move or asset. */
  oracle: AnyOracleRollable;
  /** Highlights the row with this id, as the result of a roll. */
  rolledRowId?: string;
  /** Highlights the row whose range holds this number. */
  rolledValue?: number;
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
  const {
    oracle,
    rolledRowId,
    rolledValue,
    onRoll,
    rollLabel = "Roll",
    hideHeader,
    titleAs = "h3",
    columnLabels,
    rolledLabel = "Rolled",
    size = "sm",
    className,
    ...rest
  } = withLayoutProps(props);

  const titleId = useId();
  const rows = oracle.rows as Datasworn.OracleRollableRow[];
  const textColumns = getOracleTextColumns(oracle);
  const labels = getOracleColumnLabels(oracle, columnLabels);

  const rolledRow =
    rolledRowId !== undefined
      ? rows.find((row) => row._id === rolledRowId)
      : rolledValue !== undefined
        ? findRowForRoll(rows, rolledValue)
        : undefined;

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
      <div className={scrollStyles}>
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
                <tr key={row._id} data-rolled={isRolled || undefined}>
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
