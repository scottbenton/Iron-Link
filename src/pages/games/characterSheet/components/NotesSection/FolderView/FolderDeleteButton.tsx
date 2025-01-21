import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useDeleteFolder } from "./useDeleteFolder";

export interface FolderDeleteButtonProps {
  folderId: string;
}

export function FolderDeleteButton(props: FolderDeleteButtonProps) {
  const { folderId } = props;

  const { t } = useTranslation();

  const deleteFolder = useDeleteFolder();

  return (
    <Tooltip title={t("notes.toolbar.delete-folder", "Delete Folder")}>
      <IconButton onClick={() => deleteFolder(folderId)}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );
}
