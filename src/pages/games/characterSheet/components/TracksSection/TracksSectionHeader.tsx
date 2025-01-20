import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { GamePermission } from "stores/game.store";
import { useTracksStore } from "stores/tracks.store";

import {
  TrackSectionProgressTracks,
  TrackTypes,
} from "repositories/tracks.repository";

import { EditOrCreateClockDialog } from "./EditOrCreateClockDialog";
import { EditOrCreateTrackDialog } from "./EditOrCreateTrackDialog";
import { getTrackTypeLabel } from "./common";

export interface TracksSectionHeaderProps {
  showCompletedTracks: boolean;
}

export function TracksSectionHeader(props: TracksSectionHeaderProps) {
  const { showCompletedTracks } = props;
  const { t } = useTranslation();

  const setShowCompletedTracks = useTracksStore(
    (store) => store.setShowCompletedTracks,
  );

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLButtonElement | null>(null);

  const [isAddClockDialogOpen, setIsAddClockDialogOpen] = useState(false);
  const [isAddTrackDialogOpen, setIsAddTrackDialogOpen] = useState<{
    trackType: TrackSectionProgressTracks | TrackTypes.SceneChallenge;
    open: boolean;
  }>({
    open: false,
    trackType: TrackTypes.Vow,
  });
  const handleOpenTrack = (
    trackType: TrackSectionProgressTracks | TrackTypes.SceneChallenge,
  ) => {
    setIsAddTrackDialogOpen({
      open: true,
      trackType,
    });
    setIsAddMenuOpen(false);
  };

  const isPlayer =
    useGamePermissions().gamePermission !== GamePermission.Viewer;

  return (
    <Box
      mx={-2}
      mt={-2}
      px={2}
      py={1}
      bgcolor={(theme) =>
        theme.palette.mode === "light" ? "grey.300" : "grey.700"
      }
      display="flex"
      alignItems="center"
      justifyContent="space-between"
    >
      <FormControlLabel
        label={t(
          "character.character-sidebar.show-completed-tracks",
          "Show Completed",
        )}
        control={
          <Checkbox
            checked={showCompletedTracks}
            onChange={(_, checked) => setShowCompletedTracks(checked)}
          />
        }
      />
      {isPlayer && (
        <>
          <Button
            color="inherit"
            variant="outlined"
            ref={addMenuRef}
            onClick={() => setIsAddMenuOpen(true)}
          >
            {t("character.character-sidebar.add-track", "Add Track")}
          </Button>
          <Menu
            open={isAddMenuOpen}
            anchorEl={addMenuRef.current}
            onClose={() => setIsAddMenuOpen(false)}
          >
            <MenuItem onClick={() => handleOpenTrack(TrackTypes.Vow)}>
              <ListItemText primary={getTrackTypeLabel(TrackTypes.Vow, t)} />
            </MenuItem>
            <MenuItem onClick={() => handleOpenTrack(TrackTypes.Fray)}>
              <ListItemText primary={getTrackTypeLabel(TrackTypes.Fray, t)} />
            </MenuItem>
            <MenuItem onClick={() => handleOpenTrack(TrackTypes.Journey)}>
              <ListItemText
                primary={getTrackTypeLabel(TrackTypes.Journey, t)}
              />
            </MenuItem>
            <MenuItem
              onClick={() => handleOpenTrack(TrackTypes.SceneChallenge)}
            >
              <ListItemText
                primary={getTrackTypeLabel(TrackTypes.SceneChallenge, t)}
              />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setIsAddClockDialogOpen(true);
                setIsAddMenuOpen(false);
              }}
            >
              <ListItemText primary={getTrackTypeLabel(TrackTypes.Clock, t)} />
            </MenuItem>
          </Menu>
        </>
      )}
      <EditOrCreateTrackDialog
        open={isAddTrackDialogOpen.open}
        handleClose={() =>
          setIsAddTrackDialogOpen((prev) => ({ ...prev, open: false }))
        }
        trackType={isAddTrackDialogOpen.trackType}
      />
      <EditOrCreateClockDialog
        open={isAddClockDialogOpen}
        handleClose={() => setIsAddClockDialogOpen(false)}
      />
    </Box>
  );
}
