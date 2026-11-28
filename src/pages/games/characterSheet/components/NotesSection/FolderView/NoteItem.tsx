import { NoteCard } from "ui/game/NoteCard";
import { FileTextIcon } from "ui/icons";

import { INote } from "services/notes.service";

import { NoteItemCardMenu } from "../NoteItemActions";
import { useNotesItemLink } from "../hooks/useNotesItemLink";

export interface NoteItemProps {
  id: string;
  note: INote;
}

/** A note's card in its folder: opens the note, with its menu. */
export function NoteItem(props: NoteItemProps) {
  const { id, note } = props;
  const getLink = useNotesItemLink();

  return (
    <NoteCard
      icon={<FileTextIcon />}
      title={note.title}
      link={getLink({ type: "note", itemId: id })}
      action={<NoteItemCardMenu item={{ type: "note", id }} />}
    />
  );
}
