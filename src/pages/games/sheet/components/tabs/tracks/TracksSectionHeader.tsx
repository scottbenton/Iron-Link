import { Checkbox } from "@/components/ui/checkbox";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGamePermissions } from "@/hooks/usePermissions";
import { TrackTypes } from "@/repositories/tracks.repository";
import { GamePermission } from "@/stores/game.store";
import { useTracksStore } from "@/stores/tracks.store";
import { Box, Button } from "@chakra-ui/react";

import { useTrackDialog } from "./TrackDialogProvider";
import { getTrackTypeLabel } from "./common";

export interface TracksSectionHeaderProps {
  showCompletedTracks: boolean;
}

export function TracksSectionHeader(props: TracksSectionHeaderProps) {
  const { showCompletedTracks } = props;
  const t = useGameTranslations();

  const setShowCompletedTracks = useTracksStore(
    (store) => store.setShowCompletedTracks,
  );

  const { openClockDialog, openTrackDialog } = useTrackDialog();

  const isPlayer =
    useGamePermissions().gamePermission !== GamePermission.Viewer;

  return (
    <Box
      mx={-4}
      mt={-2}
      px={4}
      py={1}
      h={12}
      bg="bg.muted"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
    >
      <Checkbox
        checked={showCompletedTracks}
        onCheckedChange={({ checked }) =>
          setShowCompletedTracks(checked === true)
        }
      >
        {t("sidebar.show-completed-tracks", "Show Completed")}
      </Checkbox>
      {isPlayer && (
        <MenuRoot>
          <MenuTrigger asChild>
            <Button colorPalette={"gray"} variant="outline">
              {t("sidebar.add-track", "Add Track")}
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem
              value={TrackTypes.Vow}
              cursor="pointer"
              onClick={() => openTrackDialog(TrackTypes.Vow)}
            >
              {getTrackTypeLabel(TrackTypes.Vow, t)}
            </MenuItem>
            <MenuItem
              value={TrackTypes.Fray}
              cursor="pointer"
              onClick={() => openTrackDialog(TrackTypes.Fray)}
            >
              {getTrackTypeLabel(TrackTypes.Fray, t)}
            </MenuItem>
            <MenuItem
              value={TrackTypes.Journey}
              cursor="pointer"
              onClick={() => openTrackDialog(TrackTypes.Journey)}
            >
              {getTrackTypeLabel(TrackTypes.Journey, t)}
            </MenuItem>
            <MenuItem
              value={TrackTypes.SceneChallenge}
              cursor="pointer"
              onClick={() => openTrackDialog(TrackTypes.SceneChallenge)}
            >
              {getTrackTypeLabel(TrackTypes.SceneChallenge, t)}
            </MenuItem>
            <MenuItem
              value={TrackTypes.Clock}
              cursor="pointer"
              onClick={() => openClockDialog()}
            >
              {getTrackTypeLabel(TrackTypes.Clock, t)}
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      )}
    </Box>
  );
}
