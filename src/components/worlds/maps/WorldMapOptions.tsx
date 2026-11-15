import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldMapsStore } from "stores/worldMaps.store";

import { WorldMapGrid, isHexGrid } from "lib/worldMap/grid";

import { IWorldMap } from "services/worldMaps.service";

import { WorldMapGridPicker } from "./WorldMapGridPicker";

// The map's settings, for editors, from a button at the end of the toolbar:
// hex flowers, the grid while nothing is painted, and whatever the tools add
// (`children`).
export function WorldMapOptions({
  map,
  painted,
  onError,
  children,
  touch = false,
}: {
  map: IWorldMap;
  // A 44px target, for phones.
  touch?: boolean;
  painted: boolean;
  onError: (cause: unknown) => void;
  children?: (close: () => void) => ReactNode;
}) {
  const { t } = useTranslation();
  const updateMap = useWorldMapsStore((store) => store.updateMap);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [gridOpen, setGridOpen] = useState(false);
  const [grid, setGrid] = useState<WorldMapGrid>(map.grid);
  const [busy, setBusy] = useState(false);
  const close = () => setAnchor(null);
  const label = t("worlds.maps.options", "Map options");

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={!!anchor}
          onClick={(event) => setAnchor(event.currentTarget)}
          size={touch ? "medium" : "small"}
          sx={touch ? { width: 44, height: 44 } : undefined}
        >
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
        {isHexGrid(map.grid) && (
          <MenuItem
            role="menuitemcheckbox"
            aria-checked={map.hexFlowers}
            onClick={() =>
              updateMap(map.entryId, { hexFlowers: !map.hexFlowers }).catch(
                onError,
              )
            }
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={map.hexFlowers}
                tabIndex={-1}
                disableRipple
                size="small"
                sx={{ p: 0 }}
              />
            </ListItemIcon>
            <ListItemText
              primary={t("worlds.maps.hex-flowers", "Hex flowers")}
              secondary={t(
                "worlds.maps.hex-flowers-help",
                "Outline clusters of 19 hexes",
              )}
            />
          </MenuItem>
        )}
        <MenuItem
          disabled={painted}
          onClick={() => {
            close();
            setGrid(map.grid);
            setGridOpen(true);
          }}
        >
          <ListItemText
            primary={t("worlds.maps.change-grid", "Change grid")}
            secondary={
              painted
                ? t(
                    "worlds.maps.change-grid-blocked",
                    "Clear the map to change its grid",
                  )
                : undefined
            }
          />
        </MenuItem>
        {children?.(close)}
      </Menu>
      <Dialog
        open={gridOpen}
        onClose={() => !busy && setGridOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("worlds.maps.change-grid", "Change grid")}</DialogTitle>
        <DialogContent>
          <WorldMapGridPicker value={grid} onChange={setGrid} disabled={busy} />
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setGridOpen(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={busy || grid === map.grid}
            onClick={() => {
              setBusy(true);
              updateMap(map.entryId, { grid })
                .then(() => setGridOpen(false))
                .catch(onError)
                .finally(() => setBusy(false));
            }}
          >
            {t("worlds.maps.change-grid-save", "Change grid")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
