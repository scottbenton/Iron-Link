import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import type { SecretsToolbarState } from "components/RichTextEditor";
import { EditorToolbarControls } from "components/RichTextEditor/toolbar";

import { ActionToolbar } from "ui/layout/ActionToolbar";
import { Box } from "ui/primitives";

import { useIsMobile } from "hooks/useIsMobile";

import { MobileNotesToolbar } from "./MobileNotesToolbar";

export interface WorldNotesToolbarProps {
  editor: Editor;
  // Stores an image where its owner keeps them and resolves to its URL.
  upload: (file: File) => Promise<string>;
  secrets?: SecretsToolbarState;
}

// The Notes tab's toolbar for a world's or an entry's Notes, built from the
// same controls as a note's. Readers see no toolbar, except a Guide's secret
// controls. On larger screens it pins to the top of the scroller while the
// Notes are on screen; on a phone it rides above the keyboard, as in Notes,
// but only while the Notes are being edited, since the page has more on it.
export function WorldNotesToolbar(props: WorldNotesToolbarProps) {
  const { editor, upload, secrets } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  if (!editor.isEditable && !secrets) return null;

  const label = t("note.editor-toolbar.label", "Formatting");

  if (isMobile) {
    return (
      <MobileNotesToolbar editor={editor} label={label}>
        <EditorToolbarControls
          editor={editor}
          upload={upload}
          secrets={secrets}
          compact
        />
      </MobileNotesToolbar>
    );
  }

  return (
    // Pinned, the strip sits right under the breadcrumbs, where the Notes
    // tab's own strip is; the padding above it scrolls off.
    <Box
      position="sticky"
      top="-2"
      zIndex="sticky"
      paddingBlock="2"
      background="bg.surface"
    >
      <ActionToolbar label={label}>
        <EditorToolbarControls
          editor={editor}
          upload={upload}
          secrets={secrets}
        />
      </ActionToolbar>
    </Box>
  );
}
