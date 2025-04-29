import { Datasworn } from "@datasworn/core";

import { OracleRollableColumn } from "./OracleRollableColumn";
import { OracleRollableTable } from "./OracleRollableTable";

export interface OracleTableProps {
  oracle: Datasworn.OracleRollable | Datasworn.EmbeddedOracleRollable;
}

export function OracleTable(props: OracleTableProps) {
  const { oracle } = props;

  if (
    oracle.oracle_type === "table_text" ||
    oracle.oracle_type === "table_text2" ||
    oracle.oracle_type === "table_text3"
  ) {
    return <OracleRollableTable oracle={oracle} />;
  } else if (
    oracle.oracle_type === "column_text" ||
    oracle.oracle_type === "column_text2" ||
    oracle.oracle_type === "column_text3"
  ) {
    return <OracleRollableColumn oracle={oracle} />;
  }
}
