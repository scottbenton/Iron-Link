import { PropsWithChildren } from "react";

import { Box } from "ui/primitives";

import { NOTES_PANE_INSET } from "./notesPaneInset";

// A folder's contents, inset like the toolbar above them.
export function OpenItemWrapper(props: PropsWithChildren) {
  const { children } = props;
  return (
    <Box paddingInline={NOTES_PANE_INSET} paddingBlockStart="4">
      {children}
    </Box>
  );
}
