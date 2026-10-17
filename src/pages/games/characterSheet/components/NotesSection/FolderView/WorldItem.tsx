import PublicIcon from "@mui/icons-material/Public";
import { Card, CardActionArea, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LinkWorldDialog } from "../WorldView/LinkWorldDialog";

// An invitation to link a world, rendered as the first tile in a Guide's root
// folder grid while the game has no world. A linked world gets its own
// section above the grid instead (GameWorldSection).
//
// Visibility lives in FolderView, which decides whether to reserve a grid slot.
export function WorldItem() {
  const { t } = useTranslation();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  return (
    <>
      <Card
        variant="outlined"
        // Plain outline: the tile sits inline among the folder cards and
        // should read as one of them, not as a highlighted item.
        sx={{
          height: "100%",
          bgcolor: "background.default",
          overflow: "hidden",
        }}
      >
        <CardActionArea
          sx={{
            height: "100%",
            py: 1.5,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1,
          }}
          onClick={() => setLinkDialogOpen(true)}
        >
          <PublicIcon color="action" />
          <Typography component="span" sx={{ flexGrow: 1 }}>
            {t("worlds.game.link-a-world", "Link a World")}
          </Typography>
        </CardActionArea>
      </Card>
      {/* Mounted only while open: the dialog loads the user's worlds on mount. */}
      {linkDialogOpen && (
        <LinkWorldDialog open onClose={() => setLinkDialogOpen(false)} />
      )}
    </>
  );
}
