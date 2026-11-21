import { Datasworn } from "@datasworn-community/core";

import { RulesText } from "ui/game/RulesText";

import { SimpleTable, SimpleTableColumnDefinition } from "./SimpleTable";

export interface OracleRollableTableProps {
  oracle:
    | Datasworn.OracleRollableTable
    | Datasworn.EmbeddedOracleTableText
    | Datasworn.EmbeddedOracleTableText2
    | Datasworn.EmbeddedOracleTableText3;
  label?: string;
  hideLabel?: boolean;
}

export function OracleRollableTable(props: OracleRollableTableProps) {
  const { oracle, label, hideLabel } = props;

  const columns: SimpleTableColumnDefinition<Datasworn.OracleRollableRow>[] = [
    {
      label: oracle.column_labels.roll,
      renderer: (row) =>
        row.roll
          ? row.roll.max - row.roll.min === 0
            ? row.roll.min
            : `${row.roll.min} - ${row.roll.max}`
          : null,
      textColor: "text.secondary",
    },
    {
      label: oracle.column_labels.text,
      renderer: (row) => <RulesText markdown={row.text} size="sm" />,
    },
  ];

  if (
    oracle.oracle_type === "table_text2" ||
    oracle.oracle_type === "table_text3"
  ) {
    columns.push({
      label: oracle.column_labels.text2,
      renderer: (row) =>
        (row as Datasworn.OracleRollableRowText2).text2 ? (
          <RulesText
            markdown={(row as Datasworn.OracleRollableRowText3).text2 ?? ""}
            size="sm"
          />
        ) : null,
    });
  }

  if (oracle.oracle_type === "table_text3") {
    columns.push({
      label: oracle.column_labels.text3,
      renderer: (row) =>
        (row as Datasworn.OracleRollableRowText3).text3 ? (
          <RulesText
            markdown={(row as Datasworn.OracleRollableRowText3).text3 ?? ""}
            size="sm"
          />
        ) : null,
    });
  }

  return (
    <>
      <SimpleTable
        columns={columns}
        rows={oracle.rows}
        label={label}
        hideLabel={hideLabel}
      />
    </>
  );
}
