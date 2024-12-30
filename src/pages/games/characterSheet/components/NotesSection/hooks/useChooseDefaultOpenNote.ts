import { useEffect } from "react";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useUID } from "stores/auth.store";
import { GamePermission } from "stores/game.store";
import {
  GUIDE_NOTE_FOLDER_NAME,
  getPlayerNotesFolder,
} from "stores/notes.store";
import { useNotesStore } from "stores/notes.store";

import { EditPermissions, ReadPermissions } from "repositories/shared.types";

export function useChooseDefaultOpenNote() {
  const isSomethingOpen = useNotesStore(
    (store) => store.openItem !== undefined,
  );
  const folderState = useNotesStore((store) => store.folderState);

  const gameId = useGameId();
  const uid = useUID();

  const { gamePermission, gameType } = useGamePermissions();

  const addFolder = useNotesStore((store) => store.createFolder);
  const setOpenItem = useNotesStore((store) => store.setOpenItem);

  useEffect(() => {
    // If our folders have loaded and we are not a viewer, lets make sure we've created our default folders
    if (
      !folderState.loading &&
      uid &&
      gamePermission !== GamePermission.Viewer
    ) {
      const userFolder = getPlayerNotesFolder(uid, folderState.folders);
      if (!userFolder) {
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
      if (gamePermission === GamePermission.Viewer) {
        return;
      }

      if (gamePermission === GamePermission.Guide) {
        const guideFolder = folderState.folders[GUIDE_NOTE_FOLDER_NAME];
        if (guideFolder) {
          setOpenItem("folder", GUIDE_NOTE_FOLDER_NAME);
          return;
        }
      }
      if (uid) {
        const userFolder = folderState.folders[uid];
        if (userFolder) {
          setOpenItem("folder", uid);
          return;
        }
      }
    }
  }, [isSomethingOpen, folderState, gamePermission, uid, setOpenItem]);
}
