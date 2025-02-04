import FolderIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Editor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "hooks/useIsMobile";

import { useNotesStore } from "stores/notes.store";

import { CommonToolbarItems } from "./CommonToolbarItems";
import { TextTypeMenu } from "./TextTypeMenu";
import { NotePermissions } from "./useNotePermission";

export interface MobileStickyNoteToolbarProps {
  openNoteId: string;
  editor: Editor;
  permissions: NotePermissions;
}

const TOOLBAR_HEIGHT = 41;

export function MobileStickyNoteToolbar(props: MobileStickyNoteToolbarProps) {
  const { openNoteId, editor, permissions } = props;

  const { t } = useTranslation();

  const parentFolder = useNotesStore((store) => {
    const currentNote = store.noteState.notes[openNoteId];
    if (!currentNote) {
      return undefined;
    }
    return store.folderState.folders[currentNote.parentFolderId];
  });
  const setOpenNoteItem = useNotesStore((store) => store.setOpenItem);

  const isMobile = useIsMobile();

  const toolbar = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeHandler = () => {
      const tb = toolbar.current;
      const vp = viewport.current;

      const wvp = window.visualViewport;
      if (tb && vp && wvp) {
        // Since the bar is position: fixed we need to offset it by the visual
        // viewport's offset from the layout viewport origin.
        const offsetLeft = viewport.current?.offsetLeft ?? 0;
        const offsetTop =
          wvp.height - vp.getBoundingClientRect().height + wvp.offsetTop;

        // You could also do this by setting style.left and style.top if you
        // use width: 100% instead.
        tb.style.transform = `translate(${offsetLeft}px, ${offsetTop}px) scale(${
          1 / wvp.scale
        })`;
        tb.style.display = "flex";
      }
    };

    // run first time to initialize
    resizeHandler();

    // subscribe to events which affect scroll, or viewport position
    window.visualViewport?.addEventListener("resize", resizeHandler);
    window.visualViewport?.addEventListener("scroll", resizeHandler);
    window?.addEventListener("touchmove", resizeHandler);

    // unsubscribe
    return () => {
      window.visualViewport?.removeEventListener("resize", resizeHandler);
      window.visualViewport?.removeEventListener("scroll", resizeHandler);
      window?.removeEventListener("touchmove", resizeHandler);
    };
  }, []);

  if (!isMobile) {
    return null;
  }
  return (
    <>
      <Box
        height={TOOLBAR_HEIGHT}
        bgcolor={(theme) =>
          theme.palette.mode === "light" ? "background.paper" : "grey.700"
        }
        borderTop={(theme) => `1px solid ${theme.palette.divider}`}
        ref={toolbar}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        px={2}
        gap={0.5}
        overflow="auto"
        display={"none"} // This will be updated above once computation is done
        zIndex={(theme) => theme.zIndex.appBar - 1}
      >
        <Tooltip
          title={t("notes.editor-toolbar.mobile.go-back", "Back to Folder")}
        >
          <IconButton
            onClick={() =>
              parentFolder && setOpenNoteItem("folder", parentFolder?.id)
            }
          >
            <FolderIcon />
          </IconButton>
        </Tooltip>
        <TextTypeMenu editor={editor} />
        <CommonToolbarItems
          editor={editor}
          openNoteId={openNoteId}
          permissions={permissions}
          hideBorders
        />
      </Box>
      <Box
        ref={viewport}
        left={0}
        position="fixed"
        width="100%"
        height="100%"
        visibility={"hidden"}
      />
    </>
  );
}
