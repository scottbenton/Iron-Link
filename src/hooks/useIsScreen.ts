import { useBreakpointValue } from "@chakra-ui/react";
import { BreakpointsToken } from "node_modules/@chakra-ui/react/dist/types/styled-system/generated/token.gen";

export function useIsScreen(
  comparator: "larger-than" | "smaller-than" | "equal-to",
  breakpoint: BreakpointsToken,
) {
  let query: Record<string, boolean> = {};

  if (comparator === "larger-than") {
    query = {
      base: false,
      [breakpoint]: true,
    };
  } else if (comparator === "smaller-than") {
    query = {
      base: true,
      [breakpoint]: false,
    };
  } else if (comparator === "equal-to") {
    query = {
      base: false,
      sm: false,
      md: false,
      lg: false,
      xl: false,
      [breakpoint]: true,
    };
  }
  const value = useBreakpointValue(query) ?? false;

  return value;
}
