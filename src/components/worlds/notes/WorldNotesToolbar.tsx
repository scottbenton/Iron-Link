import { Box } from "@mui/material";
import { Editor } from "@tiptap/react";

import { ActionToolbarStrip } from "components/Layout/ActionToolbarStrip";
import type { SecretsToolbarState } from "components/RichTextEditor";

import { FormattingToolbarItems } from "pages/games/characterSheet/components/NotesSection/NoteView/FormattingToolbarItems";
import { TextTypeDropdown } from "pages/games/characterSheet/components/NotesSection/NoteView/TextTypeDropdown";
import { TextTypeMenu } from "pages/games/characterSheet/components/NotesSection/NoteView/TextTypeMenu";

import { useIsMobile } from "hooks/useIsMobile";

import { InsertToolbarGroup } from "./InsertToolbarGroup";
import { MobileNotesToolbar } from "./MobileNotesToolbar";

// The Notes tab's toolbar for a world's or an entry's Notes, built from the
// same pieces; `upload` stores an image where its owner keeps them and
// resolves to its URL. Readers see no toolbar, except a Guide's secret
// controls. On larger screens it pins to the top of the scroller while the
// Notes are on screen; on a phone it rides above the keyboard, as in Notes,
// but only while the Notes are being edited, since the page has more on it.
export function WorldNotesToolbar({
  editor,
  upload,
  secrets,
}: {
  editor: Editor;
  upload: (file: File) => Promise<string>;
  secrets?: SecretsToolbarState;
}) {
  const isMobile = useIsMobile();
  if (!editor.isEditable && !secrets) return null;
  // Formatting acts on the editor with the caret; a reader's note has none.
  const formatting = editor.isEditable;

  if (isMobile) {
    return (
      <MobileNotesToolbar editor={editor}>
        {formatting && (
          <>
            <TextTypeMenu editor={editor} />
            <FormattingToolbarItems editor={editor} hideBorders />
          </>
        )}
        <InsertToolbarGroup
          editor={editor}
          upload={upload}
          secrets={secrets}
          sx={NO_BORDER}
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
        {formatting && (
          <>
            <TextTypeDropdown editor={editor} />
            <FormattingToolbarItems editor={editor} />
          </>
        )}
        <InsertToolbarGroup editor={editor} upload={upload} secrets={secrets} />
      </ActionToolbarStrip>
    </Box>
  );
}

const NO_BORDER = { border: "none" };
