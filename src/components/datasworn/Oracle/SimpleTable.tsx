import { Box, Table, TextProps } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface SimpleTableColumnDefinition<T> {
  label: string;
  renderer: (row: T, index: number) => ReactNode;
  textColor?: TextProps["color"];
}

export interface SimpleTableProps<T> {
  columns: SimpleTableColumnDefinition<T>[];
  rows: T[];
}

export function SimpleTable<T>(props: SimpleTableProps<T>) {
  const { columns, rows } = props;

  return (
    <Box display="flex">
      <Table.Root mt={2} variant="outline" striped borderRadius={"sm"}>
        <Table.Header>
          <Table.Row>
            {columns.map((column, index) => (
              <Table.ColumnHeader key={index} textAlign={"left"}>
                {column.label}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, index) => {
            return (
              <Table.Row key={index}>
                {columns.map((column, columnIndex) => (
                  <Table.Cell
                    key={columnIndex}
                    color={column.textColor}
                    px={1}
                    py={0.5}
                  >
                    {column.renderer(row, index)}
                  </Table.Cell>
                ))}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
