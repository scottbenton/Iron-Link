import { ReactNode } from "react";

import { ActionToolbar } from "ui/layout/ActionToolbar";
import { Box } from "ui/primitives";

import { NoteBreadcrumbs } from "./NoteBreadcrumbs";
import { NOTES_PANE_INSET } from "./notesPaneInset";

export interface NoteToolbarProps {
  /** Names the strip of actions, such as "Folder actions". */
  label: string;
  children?: ReactNode;
}

// Breadcrumbs over a strip of the open item's actions, the same chrome on
// every Notes tab. It sits on the page so content scrolling under a sticky
// toolbar stays hidden.
export function NoteToolbar(props: NoteToolbarProps) {
  const { label, children } = props;

  return (
    <Box
      background="bg.surface"
      marginInline={NOTES_PANE_INSET}
      paddingBlock="4 2"
      borderBottom="1px solid token(colors.border.default)"
    >
      <ActionToolbar label={label} breadcrumbs={<NoteBreadcrumbs />}>
        {children}
      </ActionToolbar>
    </Box>
  );
}
