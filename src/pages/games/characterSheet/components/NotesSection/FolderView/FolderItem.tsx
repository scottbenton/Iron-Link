import FolderIcon from "@mui/icons-material/Folder";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useNotesStore } from "stores/notes.store";

import { ReadPermissions } from "repositories/shared.types";

import { INoteFolder } from "services/noteFolders.service";

import { FolderActionMenu } from "./FolderActionMenu";
import { getItemName } from "./getFolderName";

export interface FolderItemProps {
  folderId: string;
  folder: INoteFolder;
}

export function FolderItem(props: FolderItemProps) {
  const { folderId, folder } = props;

  const { t } = useTranslation();
  const openTab = useNotesStore((store) => store.openItemTab);

  return (
    <Card
      variant={"outlined"}
      key={folderId}
      sx={{ bgcolor: "background.default", position: "relative" }}
    >
      <CardActionArea
        sx={{
          py: 1.5,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
        }}
        onClick={(event) => {
          openTab({
            type: "folder",
            id: folderId,
            openInBackground: true,
            replaceCurrent: !(event.ctrlKey || event.metaKey),
          });
        }}
        onAuxClick={() => {
          openTab({
            type: "folder",
            id: folderId,
            openInBackground: true,
            replaceCurrent: false,
          });
        }}
        onMouseDown={(event) => {
          if (event.button === 1) {
            event.preventDefault();
            return false;
          }
        }}
      >
        {folder.readPermissions !== ReadPermissions.OnlyAuthor ? (
          <FolderSharedIcon color="action" />
        ) : (
          <FolderIcon color="action" />
        )}
        <Typography sx={{ flexGrow: 1 }}>
          {getItemName({
            name: folder.name,
            isRootPlayerFolder: folder.isRootPlayerFolder,
            t,
          })}
        </Typography>
        <Box
          sx={(theme) => ({
            width: `calc(${theme.spacing(1 - 2)} + 40px)`,
            ml: 1,
          })}
        />
      </CardActionArea>
      <FolderActionMenu folderId={folderId} />
    </Card>
  );
}
