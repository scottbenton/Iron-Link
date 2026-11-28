import { useTranslation } from "react-i18next";

import { NoteCard } from "ui/game/NoteCard";
import { FolderIcon, FolderUserIcon } from "ui/icons";

import { ReadPermissions } from "repositories/shared.types";

import { INoteFolder } from "services/noteFolders.service";

import { NoteItemCardMenu } from "../NoteItemActions";
import { useNotesItemLink } from "../hooks/useNotesItemLink";
import { getItemName } from "./getFolderName";

export interface FolderItemProps {
  folderId: string;
  folder: INoteFolder;
}

/** A folder's card in its parent's grid: opens the folder, with its menu. */
export function FolderItem(props: FolderItemProps) {
  const { folderId, folder } = props;
  const { t } = useTranslation();
  const getLink = useNotesItemLink();

  return (
    <NoteCard
      icon={
        folder.readPermissions !== ReadPermissions.OnlyAuthor ? (
          <FolderUserIcon />
        ) : (
          <FolderIcon />
        )
      }
      title={getItemName({
        name: folder.name,
        isRootPlayerFolder: folder.isRootPlayerFolder,
        t,
      })}
      link={getLink({ type: "folder", itemId: folderId })}
      action={<NoteItemCardMenu item={{ type: "folder", id: folderId }} />}
    />
  );
}
