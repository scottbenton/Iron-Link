import type { Datasworn } from "@datasworn-community/core";

export type AnyOracleRollable =
  | Datasworn.OracleRollable
  | Datasworn.EmbeddedOracleRollable;

export type OracleTextColumn = "text" | "text2" | "text3";

export interface OracleColumnLabels {
  roll: string;
  text: string;
  text2: string;
  text3: string;
}

export const defaultOracleColumnLabels: OracleColumnLabels = {
  roll: "Roll",
  text: "Result",
  text2: "Details",
  text3: "",
};

/** Which text columns a table has, by its oracle type. */
export function getOracleTextColumns(
  oracle: AnyOracleRollable,
): OracleTextColumn[] {
  switch (oracle.oracle_type) {
    case "table_text2":
    case "column_text2":
      return ["text", "text2"];
    case "table_text3":
    case "column_text3":
      return ["text", "text2", "text3"];
    default:
      return ["text"];
  }
}

/** The table's own column labels where it has them, else the fallbacks. */
export function getOracleColumnLabels(
  oracle: AnyOracleRollable,
  fallback: Partial<OracleColumnLabels> = {},
): OracleColumnLabels {
  const labels = { ...defaultOracleColumnLabels, ...fallback };
  if ("column_labels" in oracle && oracle.column_labels) {
    return { ...labels, ...oracle.column_labels };
  }
  return labels;
}

/** "7", or "1–2" with an en dash. Empty for a row with no roll. */
export function formatRollRange(roll: Datasworn.DiceRange | null): string {
  if (!roll) return "";
  return roll.min === roll.max ? `${roll.min}` : `${roll.min}–${roll.max}`;
}

/** The row a roll of `value` lands on. */
export function findRowForRoll<Row extends Datasworn.OracleRollableRow>(
  rows: Row[],
  value: number,
): Row | undefined {
  return rows.find(
    (row) => row.roll && value >= row.roll.min && value <= row.roll.max,
  );
}

/** A row's text in one of its columns, or empty. */
export function getRowText(
  row: Datasworn.OracleRollableRow,
  column: OracleTextColumn,
): string {
  const value = (row as Partial<Record<OracleTextColumn, string | null>>)[
    column
  ];
  return value ?? "";
}

/** Whether text needs the markdown renderer or can be printed as it is. */
export function hasMarkdown(text: string): boolean {
  return /[[\]*_`{<\n|]/.test(text);
}
