import { useTranslation } from "react-i18next";

import { EmptyState } from "ui/layout/EmptyState";

import type { IOpenNoteItem } from "stores/notes.store";

import { FolderView, FolderViewToolbar } from "../FolderView";
import { OpenItemWrapper } from "../Layout";
import { NoteView } from "../NoteView";
import { GameWorldView } from "../WorldView/GameWorldView";

export interface NoteTabContentsProps {
  tabItem: IOpenNoteItem;
  folderExists: boolean;
  isRootPlayerFolder: boolean;
}

// What an open tab shows: a folder with its toolbar, a note, or the world.
export function NoteTabContents(props: NoteTabContentsProps) {
  const { tabItem, folderExists, isRootPlayerFolder } = props;
  const { t } = useTranslation();

  if (tabItem.type === "world") {
    return (
      <GameWorldView worldId={tabItem.itemId} worldView={tabItem.worldView} />
    );
  }
  if (tabItem.type === "note") {
    return <NoteView openNoteId={tabItem.itemId} />;
  }
  if (!folderExists) {
    // Unreadable folders are filtered out, like deleted ones.
    return (
      <EmptyState
        title={t("notes.folder-missing-title", "Folder unavailable")}
        message={t(
          "notes.folder-missing",
          "This folder was deleted, or you do not have access to it.",
        )}
        css={{ marginBlockStart: "8" }}
      />
    );
  }
  return (
    <>
      <FolderViewToolbar folderId={tabItem.itemId} />
      <OpenItemWrapper>
        <FolderView folderId={tabItem.itemId} />
        {isRootPlayerFolder && <FolderView folderId={undefined} />}
      </OpenItemWrapper>
    </>
  );
}
