import { Box, Typography, TypographyProps } from "@mui/material";
import { ReactNode, useId } from "react";

export interface SimpleTableColumnDefinition<T> {
  label: string;
  renderer: (row: T, index: number) => ReactNode;
  textColor?: TypographyProps["color"];
}

export interface SimpleTableProps<T> {
  columns: SimpleTableColumnDefinition<T>[];
  rows: T[];
  // Names the table for screen readers. Shown above it unless hideLabel is
  // set, for a table whose name is already on screen nearby.
  label?: string;
  hideLabel?: boolean;
}

export function SimpleTable<T>(props: SimpleTableProps<T>) {
  const { columns, rows, label, hideLabel } = props;

  const labelId = useId();
  const showLabel = !!label && !hideLabel;

  return (
    <>
      {showLabel && (
        <Typography id={labelId} component={"p"} variant={"subtitle2"} mt={1}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          overflowX: "auto",
          mx: { xs: -3, sm: 0 },
          px: { xs: 3, sm: 0 },
        }}
      >
        <Box
          component={"table"}
          aria-labelledby={showLabel ? labelId : undefined}
          aria-label={label && !showLabel ? label : undefined}
          mt={showLabel ? 0.5 : 1}
          borderColor={"divider"}
          sx={(theme) => ({
            borderCollapse: "separate",
            borderRadius: 1,
            overflow: "hidden",
            borderSpacing: 0,
            borderWidth: "1px",
            borderStyle: "solid",
            overflowX: "auto",
            width: "100%",

            "& th": {
              backgroundColor:
                theme.palette.mode === "light" ? "grey.300" : "grey.700",
            },

            "& th:nth-of-type(1)": {
              borderTopLeftRadius: theme.shape.borderRadius,
            },
            "& th:nth-last-of-type(1)": {
              borderTopRightRadius: theme.shape.borderRadius,
            },

            "& tbody tr:nth-of-type(even) td": {
              backgroundColor: theme.palette.background.default,
            },
            "& tbody tr:nth-last-of-type(1)": {
              "& td:nth-of-type(1)": {
                borderBottomLeftRadius: theme.shape.borderRadius,
              },
              "& td:nth-last-of-type(1)": {
                borderBottomRightRadius: theme.shape.borderRadius,
              },
            },
          })}
        >
          <Box component={"thead"}>
            <tr>
              {columns.map((column, index) => (
                <Typography
                  key={index}
                  component={"th"}
                  variant={"body2"}
                  textAlign={"left"}
                  p={1}
                  minWidth={"8ch"}
                  fontWeight={700}
                >
                  {column.label}
                </Typography>
              ))}
            </tr>
          </Box>
          <tbody>
            {rows.map((row, index) => {
              return (
                <Box key={index} component={"tr"}>
                  {columns.map((column, columnIndex) => (
                    <Typography
                      key={columnIndex}
                      component={"td"}
                      px={1}
                      py={0.5}
                      variant={"body2"}
                      color={column.textColor}
                    >
                      {column.renderer(row, index)}
                    </Typography>
                  ))}
                </Box>
              );
            })}
          </tbody>
        </Box>
      </Box>
    </>
  );
}
