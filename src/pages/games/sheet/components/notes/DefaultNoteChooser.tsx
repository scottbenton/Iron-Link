import { useGameId } from "@/hooks/useGameId";
import { useGamePermissions } from "@/hooks/usePermissions";
import { EditPermissions, ReadPermissions } from "@/repositories/shared.types";
import { useUID } from "@/stores/auth.store";
import { GamePermission } from "@/stores/game.store";
import { getPlayerNotesFolder, useNotesStore } from "@/stores/notes.store";
import { useEffect, useRef } from "react";

export function DefaultNoteChooser() {
  const isSomethingOpen = useNotesStore((store) => store.openItems.length > 0);
  const folderState = useNotesStore((store) => store.folderState);

  const gameId = useGameId();
  const uid = useUID();

  const { gamePermission, gameType } = useGamePermissions();

  const addFolder = useNotesStore((store) => store.createFolder);
  const setOpenItem = useNotesStore((store) => store.addOpenItem);

  const hasCreatedUserFolder = useRef(false);

  useEffect(() => {
    // If our folders have loaded and we are not a viewer, lets make sure we've created our default folders
    if (
      !folderState.loading &&
      uid &&
      gamePermission !== GamePermission.Viewer
    ) {
      const userFolder = getPlayerNotesFolder(uid, folderState.folders);
      if (!userFolder && !hasCreatedUserFolder.current) {
        hasCreatedUserFolder.current = true;
        addFolder(
          uid,
          gameId,
          null,
          uid,
          0,
          ReadPermissions.OnlyAuthor,
          EditPermissions.OnlyAuthor,
          true,
        );
      }
    }
  }, [gamePermission, gameType, folderState, uid, gameId, addFolder]);

  useEffect(() => {
    if (!isSomethingOpen && !folderState.loading) {
      console.debug("Nothing is open, opening user folder");
      if (gamePermission === GamePermission.Viewer) {
        console.debug("User is a viewer, not opening user folder");
        return;
      } else if (uid && gamePermission !== null) {
        console.debug("User is not a viewer, opening user folder");
        const userFolder = getPlayerNotesFolder(uid, folderState.folders);

        if (userFolder) {
          console.debug("Opening user folder");
          setOpenItem("folder", userFolder.id);
          return;
        }
      }
    }
  }, [isSomethingOpen, folderState, gamePermission, uid, setOpenItem]);
  return null;
}
