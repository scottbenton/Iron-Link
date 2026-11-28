import { Editor } from "@tiptap/react";
import { PropsWithChildren, useRef } from "react";

import { MobileKeyboardToolbar } from "./MobileKeyboardToolbar";
import { useKeyboardToolbarVisibility } from "./useKeyboardToolbarVisibility";

export interface MobileNotesToolbarProps extends PropsWithChildren {
  editor: Editor;
  /** Names the toolbar, such as "Formatting". */
  label: string;
}

// The phone toolbar for Notes, a note's or a world's or entry's, shown only
// while focus is in the editor, the bar, or a menu the bar opened. Hidden
// otherwise, so it never covers a page that is only being read, nor shows
// over another section while the Notes stay mounted out of sight.
export function MobileNotesToolbar(props: MobileNotesToolbarProps) {
  const { editor, label, children } = props;

  const bar = useRef<HTMLDivElement>(null);
  const editing = useKeyboardToolbarVisibility(editor, bar);

  return (
    <MobileKeyboardToolbar
      ref={bar}
      label={label}
      hidden={!editing}
      // Pressing a button keeps the editor, and the keyboard, focused.
      onMouseDown={(event) => event.preventDefault()}
    >
      {children}
    </MobileKeyboardToolbar>
  );
}
