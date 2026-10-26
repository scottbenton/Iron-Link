import TuneIcon from "@mui/icons-material/Tune";
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
} from "@mui/material";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldMapsStore } from "stores/worldMaps.store";

import { WorldMapGrid, isHexGrid } from "lib/worldMap/grid";

import { IWorldMap } from "services/worldMaps.service";

import { WorldMapGridPicker } from "./WorldMapGridPicker";

// The map's settings, for editors: hex flowers, the grid while nothing is
// painted, and whatever the tools add (`children`).
export function WorldMapOptions({
  map,
  painted,
  onError,
  children,
  touch = false,
}: {
  map: IWorldMap;
  // An icon button with a 44px target, for phones.
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
      {touch ? (
        <IconButton
          aria-label={label}
          aria-haspopup="menu"
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{
            width: 44,
            height: 44,
            bgcolor: "background.paper",
            color: "text.primary",
            boxShadow: 2,
            "&:hover": { bgcolor: "background.paper" },
          }}
        >
          <TuneIcon />
        </IconButton>
      ) : (
        <Button
          size="small"
          variant="contained"
          color="inherit"
          startIcon={<TuneIcon />}
          aria-haspopup="menu"
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{ bgcolor: "background.paper", color: "text.primary" }}
        >
          {label}
        </Button>
      )}
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
      <Dialog open={gridOpen} onClose={() => !busy && setGridOpen(false)}>
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
