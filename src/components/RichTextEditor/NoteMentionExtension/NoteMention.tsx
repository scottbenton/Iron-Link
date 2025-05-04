import AtIcon from "@mui/icons-material/AlternateEmail";
import { Chip } from "@mui/material";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { MouseEvent, useCallback } from "react";

import { useNotesStore } from "stores/notes.store";

export function NoteMention(props: NodeViewProps) {
  const { node } = props;
  const label = node.attrs.label;
  const id = node.attrs.id;

  const isNoteAvailable = useNotesStore((state) => !!state.noteState.notes[id]);
  const openNote = useNotesStore((state) => state.openItemTab);

  const handleClick = useCallback(
    (evt: MouseEvent) => {
      const openInNewTab = evt.ctrlKey || evt.metaKey;
      openNote({
        type: "note",
        id: id,
        replaceCurrent: !openInNewTab,
        openInBackground: openInNewTab,
      });
    },
    [id, openNote],
  );

  const handleAuxClick = useCallback(() => {
    openNote({
      type: "note",
      id: id,
      replaceCurrent: false,
      openInBackground: true,
    });
  }, [openNote, id]);

  return (
    <NodeViewWrapper as="span">
      <Chip
        icon={<AtIcon />}
        label={label}
        color={isNoteAvailable ? "default" : "error"}
        size="small"
        clickable={isNoteAvailable}
        onClick={isNoteAvailable ? handleClick : undefined}
        onAuxClick={isNoteAvailable ? handleAuxClick : undefined}
        onMouseDown={(evt) => {
          if (evt.button === 1) {
            evt.preventDefault();
          }
        }}
      />
    </NodeViewWrapper>
  );
}
