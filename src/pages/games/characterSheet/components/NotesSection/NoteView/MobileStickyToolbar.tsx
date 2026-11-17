import CheckIcon from "@mui/icons-material/Check";
import { Box, Button } from "@mui/material";
import { Editor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { SecretsToolbarState } from "components/RichTextEditor";

import { useIsMobile } from "hooks/useIsMobile";

import { CommonToolbarItems } from "./CommonToolbarItems";
import { MobileKeyboardToolbar } from "./MobileKeyboardToolbar";
import { TextTypeMenu } from "./TextTypeMenu";
import { useKeyboardToolbarVisibility } from "./useKeyboardToolbarVisibility";
import { NotePermissions } from "./useNotePermission";

// The smallest a button in the bar may be each way, so it is easy to tap.
const MIN_TAP_TARGET = 44;

export interface MobileStickyNoteToolbarProps {
  openNoteId: string;
  editor: Editor;
  permissions: NotePermissions;
  secrets?: SecretsToolbarState;
}

// A note's formatting toolbar on phones. It rides on the keyboard and shows
// only while the note is being edited: focus in its text, the bar, or a menu
// the bar opened. Done editing, or Escape in the text, ends editing, which
// closes the keyboard and hides the bar. It is read right after the note's
// title, before its text.
export function MobileStickyNoteToolbar(props: MobileStickyNoteToolbarProps) {
  const { openNoteId, editor, permissions, secrets } = props;

  const isMobile = useIsMobile();

  if (!isMobile || !permissions.canEdit) {
    return null;
  }
  return (
    <MobileFormattingToolbar
      openNoteId={openNoteId}
      editor={editor}
      permissions={permissions}
      secrets={secrets}
    />
  );
}

function MobileFormattingToolbar(props: MobileStickyNoteToolbarProps) {
  const { openNoteId, editor, permissions, secrets } = props;
  const { t } = useTranslation();

  const bar = useRef<HTMLDivElement>(null);
  const editing = useKeyboardToolbarVisibility(editor, bar);

  // Read when called, since `editor` changes as the caret moves into and out
  // of a secret block.
  const editorRef = useRef(editor);
  editorRef.current = editor;

  const stopEditing = () => {
    // At once, where the editor's own blur command waits a frame, so the
    // bar hides with the keyboard.
    const current = editorRef.current;
    if (!current.isDestroyed) {
      current.view.dom.blur();
      window.getSelection()?.removeAllRanges();
    }
    // The bar's own buttons may hold focus too, from a keyboard or a screen
    // reader.
    const active = document.activeElement;
    if (active instanceof HTMLElement && bar.current?.contains(active)) {
      active.blur();
    }
  };
  const stopEditingRef = useRef(stopEditing);
  stopEditingRef.current = stopEditing;

  // Escape in the text ends editing, unless something in the editor (a
  // mention's suggestions, say) already used it.
  useEffect(() => {
    if (!editing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const current = editorRef.current;
      if (current.isDestroyed) return;
      if (
        !(event.target instanceof Node) ||
        !current.view.dom.contains(event.target)
      ) {
        return;
      }
      event.preventDefault();
      stopEditingRef.current();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editing]);

  return (
    <MobileKeyboardToolbar
      ref={bar}
      hidden={!editing}
      inPlace
      label={t("notes.editor-toolbar.mobile.label", "Formatting")}
      end={
        <Button
          variant={"contained"}
          startIcon={<CheckIcon />}
          onMouseDown={(event) => event.preventDefault()}
          onClick={stopEditing}
          sx={{ minHeight: MIN_TAP_TARGET, whiteSpace: "nowrap" }}
        >
          {t("notes.editor-toolbar.mobile.done", "Done editing")}
        </Button>
      }
    >
      {/* Pressing a button keeps the editor, and the keyboard, focused. */}
      <Box
        sx={{ display: "contents" }}
        onMouseDown={(event) => event.preventDefault()}
      >
        <TextTypeMenu editor={editor} />
        <CommonToolbarItems
          editor={editor}
          openNoteId={openNoteId}
          permissions={permissions}
          secrets={secrets}
          hideBorders
          hideNoteActions
        />
      </Box>
    </MobileKeyboardToolbar>
  );
}
