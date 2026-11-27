import { Datasworn } from "@datasworn-community/core";
import { useTranslation } from "react-i18next";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "ui/components/Table";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { formatRollRange } from "ui/game/OracleTable";
import { RulesText } from "ui/game/RulesText";

export interface OracleTableSharedTextProps {
  oracle:
    | Datasworn.OracleTableSharedText
    | Datasworn.OracleTableSharedText2
    | Datasworn.OracleTableSharedText3;
}

// A collection whose oracles share one set of results, such as Starforged's
// Planet Peril: a roll column per oracle, then the shared text. Whatever shows
// it names the collection already, so the caption is for screen readers.
export function OracleTableSharedText(props: OracleTableSharedTextProps) {
  const { oracle } = props;
  const { t } = useTranslation();

  const subOracles = Object.values(oracle.contents ?? {});
  const rows = subOracles[0]?.rows as
    | Datasworn.OracleRollableRowText3[]
    | undefined;

  if (!rows) {
    return null;
  }

  const hasText2 =
    oracle.oracle_type === "table_shared_text2" ||
    oracle.oracle_type === "table_shared_text3";

  return (
    <Table density="compact">
      <TableCaption>
        <VisuallyHidden>{oracle.name}</VisuallyHidden>
      </TableCaption>
      <TableHead>
        <TableRow>
          {subOracles.map((subOracle) => (
            <TableHeaderCell key={subOracle._id} numeric>
              {subOracle.name}
            </TableHeaderCell>
          ))}
          <TableHeaderCell>
            {oracle.column_labels.text ||
              t("datasworn.oracle-table.result", "Result")}
          </TableHeaderCell>
          {hasText2 && (
            <TableHeaderCell>
              {(oracle as Datasworn.OracleTableSharedText2).column_labels
                .text2 || t("datasworn.oracle-table.details", "Details")}
            </TableHeaderCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={row._id ?? index}>
            {subOracles.map((subOracle) => (
              <TableCell key={subOracle._id} numeric>
                {formatRollRange(subOracle.rows[index]?.roll ?? null)}
              </TableCell>
            ))}
            <TableCell>
              <RulesText markdown={row.text} size="sm" />
            </TableCell>
            {hasText2 && (
              <TableCell>
                {row.text2 ? (
                  <RulesText markdown={row.text2} size="sm" />
                ) : null}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
