import FolderIcon from "@mui/icons-material/Folder";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import WorldIcon from "@mui/icons-material/Language";
import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { useCallback } from "react";
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
  const handleOpen = useCallback(
    (replaceCurrent: boolean) => {
      openTab({
        type: folderId === "world" ? "world" : "folder",
        id: folderId,
        openInBackground: false,
        replaceCurrent,
      });
    },
    [openTab, folderId],
  );

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
          handleOpen(!(event.ctrlKey || event.metaKey));
        }}
        onAuxClick={() => {
          handleOpen(false);
        }}
        onMouseDown={(event) => {
          if (event.button === 1) {
            event.preventDefault();
            return false;
          }
        }}
      >
        {folderId === "world" ? (
          <WorldIcon color="action" />
        ) : (
          <>
            {folder.readPermissions !== ReadPermissions.OnlyAuthor ? (
              <FolderSharedIcon color="action" />
            ) : (
              <FolderIcon color="action" />
            )}
          </>
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
      {folderId !== "world" && <FolderActionMenu folderId={folderId} />}
    </Card>
  );
}
