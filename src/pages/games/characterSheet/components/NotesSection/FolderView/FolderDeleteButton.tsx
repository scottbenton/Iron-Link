import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useItemName } from "stores/notes.store";

import { useDeleteFolder } from "./useDeleteFolder";

export interface FolderDeleteButtonProps {
  folderId: string;
}

export function FolderDeleteButton(props: FolderDeleteButtonProps) {
  const { folderId } = props;

  const { t } = useTranslation();

  const deleteFolder = useDeleteFolder();
  const folderName = useItemName("folder", folderId);

  return (
    <Tooltip title={t("notes.toolbar.delete-folder", "Delete Folder")}>
      <IconButton onClick={() => deleteFolder(folderId, folderName)}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );
}
