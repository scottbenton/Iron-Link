import { LinearProgress } from "@mui/material";

import { useNotesStore } from "stores/notes.store";

import { DefaultNoteChooser } from "./DefaultNoteChooser";
import { NoteTabs } from "./NoteTabs/NoteTabs";

export function NotesSection() {
  const areBasicNotesLoading = useNotesStore(
    (store) => store.folderState.loading || store.noteState.loading,
  );

  if (areBasicNotesLoading) {
    return <LinearProgress />;
  }

  return (
    <>
      <DefaultNoteChooser />
      <NoteTabs />
    </>
  );
}
