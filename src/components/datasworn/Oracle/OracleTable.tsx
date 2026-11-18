import { Datasworn } from "@datasworn-community/core";

import { OracleRollableColumn } from "./OracleRollableColumn";
import { OracleRollableTable } from "./OracleRollableTable";

export interface OracleTableProps {
  oracle: Datasworn.OracleRollable | Datasworn.EmbeddedOracleRollable;
  // Names the table, for screen readers and, unless hideLabel is set, on
  // screen above it.
  label?: string;
  hideLabel?: boolean;
}

export function OracleTable(props: OracleTableProps) {
  const { oracle, label, hideLabel } = props;

  if (
    oracle.oracle_type === "table_text" ||
    oracle.oracle_type === "table_text2" ||
    oracle.oracle_type === "table_text3"
  ) {
    return (
      <OracleRollableTable
        oracle={oracle}
        label={label}
        hideLabel={hideLabel}
      />
    );
  } else if (
    oracle.oracle_type === "column_text" ||
    oracle.oracle_type === "column_text2" ||
    oracle.oracle_type === "column_text3"
  ) {
    return (
      <OracleRollableColumn
        oracle={oracle}
        label={label}
        hideLabel={hideLabel}
      />
    );
  }
}
