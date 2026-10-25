import { Box } from "@mui/material";
import { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

import { ActionToolbarStrip } from "components/Layout/ActionToolbarStrip";

import { FormattingToolbarItems } from "pages/games/characterSheet/components/NotesSection/NoteView/FormattingToolbarItems";
import { MobileKeyboardToolbar } from "pages/games/characterSheet/components/NotesSection/NoteView/MobileKeyboardToolbar";
import { TextTypeDropdown } from "pages/games/characterSheet/components/NotesSection/NoteView/TextTypeDropdown";
import { TextTypeMenu } from "pages/games/characterSheet/components/NotesSection/NoteView/TextTypeMenu";
import { UploadImageButton } from "pages/games/characterSheet/components/NotesSection/NoteView/UploadImageButton";

import { useIsMobile } from "hooks/useIsMobile";

const NOTES_IMAGE_TYPES = "image/png,image/jpeg,image/gif,image/webp";

// The Notes tab's toolbar for a world's or an entry's Notes, built from the
// same pieces; `upload` stores an image where its owner keeps them and
// resolves to its URL. Readers see no toolbar. On larger screens it pins to the top of the scroller while the
// Notes are on screen; on a phone it rides above the keyboard, as in Notes,
// but only while the Notes are being edited, since the page has more on it.
export function WorldNotesToolbar({
  editor,
  upload,
}: {
  editor: Editor;
  upload: (file: File) => Promise<string>;
}) {
  const isMobile = useIsMobile();
  if (!editor.isEditable) return null;

  if (isMobile) {
    return (
      <MobileNotesToolbar editor={editor}>
        <TextTypeMenu editor={editor} />
        <FormattingToolbarItems editor={editor} hideBorders />
        <UploadImageButton
          editor={editor}
          upload={upload}
          accept={NOTES_IMAGE_TYPES}
        />
      </MobileNotesToolbar>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        position: "sticky",
        // Pinned, the strip sits right under the breadcrumbs, where the
        // Notes tab's own strip is; the padding above it scrolls off.
        top: theme.spacing(-1),
        zIndex: 2,
        py: 1,
        bgcolor: "background.paper",
      })}
    >
      <ActionToolbarStrip>
        <TextTypeDropdown editor={editor} />
        <FormattingToolbarItems editor={editor} />
        <UploadImageButton
          editor={editor}
          upload={upload}
          accept={NOTES_IMAGE_TYPES}
        />
      </ActionToolbarStrip>
    </Box>
  );
}

// Shown while focus is in the editor, the bar, or a menu the bar opened.
function MobileNotesToolbar({
  editor,
  children,
}: {
  editor: Editor;
  children: React.ReactNode;
}) {
  const bar = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(() => editor.isFocused);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      setEditing(
        editor.view.dom.contains(target) ||
          !!bar.current?.contains(target) ||
          !!target.closest(".MuiPopover-root, .MuiMenu-root"),
      );
    };
    // Tapping the page outside moves focus nowhere, so no focusin follows.
    const onBlur = ({ event }: { event: FocusEvent }) => {
      if (!event.relatedTarget) setEditing(false);
    };
    document.addEventListener("focusin", onFocusIn);
    editor.on("blur", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      editor.off("blur", onBlur);
    };
  }, [editor]);

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
