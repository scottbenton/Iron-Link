import { Datasworn } from "@datasworn/core";

import {
  SimpleTable,
  SimpleTableColumnDefinition,
} from "components/datasworn/Oracle/SimpleTable";
import { MarkdownRenderer } from "components/MarkdownRenderer";

export interface OracleTableSharedTextProps {
  oracle:
    | Datasworn.OracleTableSharedText
    | Datasworn.OracleTableSharedText2
    | Datasworn.OracleTableSharedText3;
}

export function OracleTableSharedText(props: OracleTableSharedTextProps) {
  const { oracle } = props;

  const contentArr = Object.values(oracle.contents ?? {});
  const rows = contentArr.length > 0 ? contentArr[0].rows : undefined;

  if (!rows) {
    return null;
  }

  const columns: SimpleTableColumnDefinition<Datasworn.OracleRollableRowText3>[] =
    [];

  const contentValues:
    | (
        | Datasworn.OracleColumnText
        | Datasworn.OracleColumnText2
        | Datasworn.OracleColumnText3
      )[]
    | undefined = oracle.contents ? Object.values(oracle.contents) : undefined;

  contentValues?.forEach((subOracle) => {
    columns.push({
      label: subOracle.name,
      renderer: (_, index) => {
        const row = subOracle.rows[index];

        return row.roll
          ? row.roll.max - row.roll.min === 0
            ? row.roll.min
            : `${row.roll.min} - ${row.roll.max}`
          : null;
      },
      textColor: "text.secondary",
    });
  });

  columns.push({
    label: oracle.column_labels.text,
    renderer: (row) => <MarkdownRenderer markdown={row.text} />,
  });

  if (
    oracle.oracle_type === "table_shared_text2" ||
    oracle.oracle_type === "table_shared_text3"
  ) {
    columns.push({
      label: (oracle as Datasworn.OracleTableSharedText2).column_labels.text2,
      renderer: (row) =>
        row.text2 ? <MarkdownRenderer markdown={row.text2 ?? ""} /> : null,
    });
  }

  return <SimpleTable columns={columns} rows={rows} />;
}
