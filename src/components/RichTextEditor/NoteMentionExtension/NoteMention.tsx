import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { MouseEvent, useCallback } from "react";

import { Chip } from "ui/components/Chip";
import { AtIcon } from "ui/icons";

import { useNotesStore } from "stores/notes.store";

import { WorldEntryMention } from "./WorldEntryMention";

export function NoteMention(props: NodeViewProps) {
  const { node } = props;
  if (node.attrs.kind === "worldEntry") {
    return (
      <NodeViewWrapper as="span">
        <WorldEntryMention entryId={node.attrs.id} />
      </NodeViewWrapper>
    );
  }
  return <NoteMentionChip {...props} />;
}

function NoteMentionChip(props: NodeViewProps) {
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

  if (!isNoteAvailable) {
    return (
      <NodeViewWrapper as="span">
        <Chip size="sm" variant="soft" tone="danger" icon={<AtIcon />}>
          {label}
        </Chip>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span">
      <Chip
        size="sm"
        variant="soft"
        icon={<AtIcon />}
        render={
          <button
            type="button"
            onAuxClick={handleAuxClick}
            onMouseDown={(evt) => {
              // A middle press would otherwise start the browser's autoscroll.
              if (evt.button === 1) {
                evt.preventDefault();
              }
            }}
          />
        }
        onClick={handleClick}
      >
        {label}
      </Chip>
    </NodeViewWrapper>
  );
}
