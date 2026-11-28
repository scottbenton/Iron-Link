import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";

import { IconButton } from "ui/components/IconButton";
import { NoteCard } from "ui/game/NoteCard";
import { DotsSixVerticalIcon, FileTextIcon } from "ui/icons";

import { INote } from "services/notes.service";

import { NoteItemCardMenu } from "../NoteItemActions";
import { useNotesItemLink } from "../hooks/useNotesItemLink";

export interface SortableNoteItemProps {
  id: string;
  note: INote;
}

/** A note's card with a handle that drags it, or moves it by keyboard. */
export function SortableNoteItem(props: SortableNoteItemProps) {
  const { id, note } = props;
  const { t } = useTranslation();
  const getLink = useNotesItemLink();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <NoteCard
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
      }}
      icon={<FileTextIcon />}
      title={note.title}
      link={getLink({ type: "note", itemId: id })}
      start={
        <IconButton
          ref={setActivatorNodeRef}
          label={t("notes.sort.handle", "Move {{name}}", { name: note.title })}
          size="sm"
          css={{ cursor: isDragging ? "grabbing" : "grab" }}
          {...attributes}
          {...listeners}
        >
          <DotsSixVerticalIcon />
        </IconButton>
      }
      action={<NoteItemCardMenu item={{ type: "note", id }} />}
    />
  );
}
