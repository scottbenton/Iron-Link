import { LinearProgress } from "@mui/material";

import { useNotesStore } from "stores/notes.store";

import { DefaultNoteChooser } from "./DefaultNoteChooser";
import { NoteTabs } from "./NoteTabs/NoteTabs";
import { useListenToGameWorld } from "./hooks/useGameWorld";

export function NotesSection() {
  // Single owner of the linked world's subscription for everything below.
  useListenToGameWorld();

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
