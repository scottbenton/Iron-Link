import { Box } from "@mui/material";
import { Editor } from "@tiptap/react";
import { PropsWithChildren, useRef } from "react";

import { MobileKeyboardToolbar } from "pages/games/characterSheet/components/NotesSection/NoteView/MobileKeyboardToolbar";
import { useKeyboardToolbarVisibility } from "pages/games/characterSheet/components/NotesSection/NoteView/useKeyboardToolbarVisibility";

export interface MobileNotesToolbarProps extends PropsWithChildren {
  editor: Editor;
}

// The phone toolbar for a world's or an entry's Notes, shown only while focus
// is in the editor, the bar, or a menu the bar opened.
export function MobileNotesToolbar(props: MobileNotesToolbarProps) {
  const { editor, children } = props;

  const bar = useRef<HTMLDivElement>(null);
  const editing = useKeyboardToolbarVisibility(editor, bar);

  return (
    <MobileKeyboardToolbar hidden={!editing}>
      {/* Pressing a button keeps the editor, and the keyboard, focused. */}
      <Box
        ref={bar}
        sx={{ display: "contents" }}
        onMouseDown={(event) => event.preventDefault()}
      >
        {children}
      </Box>
    </MobileKeyboardToolbar>
  );
}
