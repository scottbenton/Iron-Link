import { Box } from "@mui/material";
import { PropsWithChildren } from "react";

export interface ScreenReaderOnlyProps {
  id?: string;
  live?: boolean;
}

export function ScreenReaderOnly(
  props: PropsWithChildren<ScreenReaderOnlyProps>,
) {
  const { id, live, children } = props;

  return (
    <Box
      position={"absolute"}
      // "1px", not 1: MUI reads a bare 1 as 100%, which stretched the
      // region across the page.
      width={"1px"}
      height={"1px"}
      padding={0}
      margin={"-1px"}
      overflow={"hidden"}
      whiteSpace={"nowrap"}
      border={0}
      sx={{ clip: "rect(0, 0, 0, 0)", clipPath: "inset(50%)" }}
      aria-live={live ? "polite" : undefined}
      id={id}
    >
      {children}
    </Box>
  );
}
