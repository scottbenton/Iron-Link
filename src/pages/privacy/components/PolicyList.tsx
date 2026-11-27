import { ReactNode } from "react";

import { Box } from "ui/primitives";

/** A bulleted list of policy points; each child is one point. */
export function PolicyList(props: { children: ReactNode }) {
  const { children } = props;
  return (
    <Box
      as="ul"
      margin="0"
      paddingInlineStart="6"
      display="grid"
      gap="1"
      fontSize="md"
      lineHeight="normal"
    >
      {children}
    </Box>
  );
}
