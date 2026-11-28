import { Editor } from "@tiptap/react";
import { PropsWithChildren, useRef } from "react";

import {
  MobileKeyboardToolbar,
  useKeyboardToolbarVisibility,
} from "components/RichTextEditor/toolbar";

export interface MobileNotesToolbarProps extends PropsWithChildren {
  editor: Editor;
  /** Names the toolbar, such as "Formatting". */
  label: string;
}

// The phone toolbar for a world's or an entry's Notes, shown only while focus
// is in the editor, the bar, or a menu the bar opened.
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
