import PublicIcon from "@mui/icons-material/Public";
import PushPinIcon from "@mui/icons-material/PushPin";
import { Card, CardActionArea, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useNotesStore } from "stores/notes.store";
import { useWorldPermission, useWorldStore } from "stores/world.store";

import { WorldPermission } from "repositories/shared.types";

import { LinkWorldDialog } from "../WorldView/LinkWorldDialog";
import { useGameWorldId, useShowWorldItem } from "../hooks/useGameWorld";

// The game's world, rendered as the first tile inside the folder grid so it
// reads as the first folder in the list. It is deliberately not a node in the
// sortable tree: it has no sort order, cannot be moved into a folder, and is
// not owned by the notes tables.
//
// Its position does not depend on who owns the world. The world belongs to the
// game, so every member should find it in the same place; keying placement off
// the viewer's role would put it somewhere different for each player and move
// it under them if their role changed. Derived access is labelled on the tile
// instead.
//
// Visibility lives in useShowWorldItem so the grid can decide whether to
// reserve a slot; this component assumes it should render.
export function WorldItem() {
  const { t } = useTranslation();

  const worldId = useGameWorldId();
  const show = useShowWorldItem();
  const worldName = useWorldStore((store) =>
    store.world && store.world.id === worldId ? store.world.name : undefined,
  );
  const openTab = useNotesStore((store) => store.openItemTab);
  // owner/editor come only from explicit membership; guide/player mean the
  // world reached this viewer through the game, i.e. somebody shared it.
  const worldPermission = useWorldPermission();
  const isSharedWithViewer =
    worldPermission === WorldPermission.Guide ||
    worldPermission === WorldPermission.Player;

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  if (!show) {
    return null;
  }

  const label = worldId
    ? (worldName ?? t("worlds.tab.world", "World"))
    : t("worlds.game.link-a-world", "Link a World");

  return (
    <>
      <Card
        variant="outlined"
        // Plain outline in both states: the tile sits inline among the folder
        // cards and should read as one of them, not as a highlighted item.
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
          onClick={(event) => {
            if (worldId) {
              openTab({
                type: "world",
                id: worldId,
                openInBackground: true,
                replaceCurrent: !(event.ctrlKey || event.metaKey),
                disallowDuplicates: true,
              });
            } else {
              setLinkDialogOpen(true);
            }
          }}
        >
          <PublicIcon color="action" />
          <Typography component="span" sx={{ flexGrow: 1 }}>
            {label}
            {worldId && isSharedWithViewer && (
              <Typography
                color="text.secondary"
                variant="caption"
                component="span"
                display="block"
              >
                {t("notes.shared-with-me", "Shared with you")}
              </Typography>
            )}
          </Typography>
          <Tooltip title={t("worlds.game.pinned", "Pinned to this game")}>
            <PushPinIcon fontSize="small" color="disabled" />
          </Tooltip>
        </CardActionArea>
      </Card>
      {/* Mounted only while open: the dialog loads the user's worlds on mount. */}
      {linkDialogOpen && (
        <LinkWorldDialog open onClose={() => setLinkDialogOpen(false)} />
      )}
    </>
  );
}
