import AtIcon from "@mui/icons-material/AlternateEmail";
import { Chip } from "@mui/material";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useCallback } from "react";

import { useNotesStore } from "stores/notes.store";

export function NoteMention(props: NodeViewProps) {
  const { node } = props;
  const label = node.attrs.label;
  const id = node.attrs.id;

  const isNoteAvailable = useNotesStore((state) => !!state.noteState.notes[id]);
  const openNote = useNotesStore((state) => state.setOpenItem);

  const handleClick = useCallback(() => {
    openNote("note", id);
  }, [id, openNote]);

  return (
    <NodeViewWrapper as="span">
      <Chip
        icon={<AtIcon />}
        label={label}
        color={isNoteAvailable ? "default" : "error"}
        size="small"
        clickable={isNoteAvailable}
        onClick={isNoteAvailable ? handleClick : undefined}
      />
    </NodeViewWrapper>
  );
}
