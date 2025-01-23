import CheckIcon from "@mui/icons-material/Check";
import { Box, Button } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DebouncedClockCircle } from "components/datasworn/Clocks/DebouncedClockCircle";
import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import { useSetAnnouncement } from "stores/appState.store";
import { useSecondScreenStore } from "stores/secondScreen.store";
import { useTracksStore } from "stores/tracks.store";

import {
  Difficulty,
  TrackStatus,
  TrackTypes,
} from "repositories/tracks.repository";

import { IProgressTrack, ISceneChallenge } from "services/tracks.service";

import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter";
import { EditOrCreateTrackDialog } from "./EditOrCreateTrackDialog";
import { TrackCompletionMoveButton } from "./TrackCompletionMoveButton";
import { getTrackTypeLabel, trackCompletionMoveIds } from "./common";

export interface TrackProgressTrackProps {
  trackId: string;
  track: IProgressTrack | ISceneChallenge;
  canEdit: boolean;
}

const difficultySteps: Record<Difficulty, number> = {
  [Difficulty.Troublesome]: 12,
  [Difficulty.Dangerous]: 8,
  [Difficulty.Formidable]: 4,
  [Difficulty.Extreme]: 2,
  [Difficulty.Epic]: 1,
};

export function TrackProgressTrack(props: TrackProgressTrackProps) {
  const { trackId, track, canEdit } = props;

  const gameId = useGameId();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const { t } = useTranslation();
  const announce = useSetAnnouncement();
  const confirm = useConfirm();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const updateTrackStatus = useTracksStore((store) => store.updateTrackStatus);
  const handleStatusChange = (status: TrackStatus) => {
    updateTrackStatus(trackId, status)
      .then(() => {
        announce(
          t(
            "character.character-sidebar.tracks-progress-track-status-changed",
            "{{label}} is now {{status}}",
            {
              label: track.label,
              status,
            },
          ),
        );
      })
      .catch(() => {});
  };

  const deleteTrack = useTracksStore((store) => store.deleteTrack);
  const handleDeleteClick = () => {
    confirm({
      description: t(
        "character.character-sidebar.tracks-progress-track-delete-confirmation",
        "Are you sure you want to delete {{label}}? This action cannot be undone.",
        {
          label: track.label,
        },
      ),
      confirmationText: t("common.delete", "Delete"),
    })
      .then(() => {
        deleteTrack(trackId)
          .then(() => {
            announce(
              t(
                "character.character-sidebar.tracks-progress-track-deleted",
                "{{label}} has been deleted",
                {
                  label: track.label,
                },
              ),
            );
          })
          .catch(() => {});
      })
      .catch(() => {});
  };

  const updateTrackValue = useTracksStore((store) => store.updateTrackValue);
  const handleUpdateValue = (value: number) => {
    updateTrackValue(trackId, value).catch(() => {});
  };

  const areSecondScreenSettingsActive = useSecondScreenFeature();
  const updateSecondScreen = useSecondScreenStore(
    (store) => store.updateSecondScreenSettings,
  );
  const isTrackOpenOnSecondScreen = useSecondScreenStore(
    (store) =>
      store.settings?.type === "track" && store.settings.trackId === trackId,
  );

  const updateClockFilledSegments = useTracksStore(
    (store) => store.updateClockFilledSegments,
  );
  const handleSceneChallengeClockChange = (filledSegments: number) => {
    if (track.type === TrackTypes.SceneChallenge) {
      updateClockFilledSegments(trackId, filledSegments)
        .then(() => {
          announce(
            t(
              "character.character-sidebar.tracks-progress-track-status-changed",
              "{{label}} is now {{status}}",
              {
                label: track.label,
                status,
              },
            ),
          );
        })
        .catch(() => {});
    }
  };

  return (
    <>
      <EditOrCreateTrackDialog
        open={isEditDialogOpen}
        handleClose={() => setIsEditDialogOpen(false)}
        initialTrack={{
          trackId,
          track,
        }}
        trackType={track.type}
      />
      <Box display="flex" flexDirection="column" alignItems="flex-start">
        <ProgressTrack
          trackType={getTrackTypeLabel(track.type, t)}
          difficulty={track.difficulty}
          step={difficultySteps[track.difficulty]}
          label={track.label}
          value={track.value}
          description={track.description}
          status={track.status}
          onEditClick={canEdit ? () => setIsEditDialogOpen(true) : undefined}
          onChange={canEdit ? handleUpdateValue : undefined}
        />
        {track.type === TrackTypes.SceneChallenge && (
          <DebouncedClockCircle
            size={"small"}
            segments={4}
            value={track.segmentsFilled}
            voiceLabel={track.label}
            onFilledSegmentsChange={
              canEdit ? handleSceneChallengeClockChange : undefined
            }
            sx={{ mt: 1 }}
          />
        )}
        <Box
          display="flex"
          flexDirection="column"
          gap={1}
          mt={1}
          alignItems="flex-start"
        >
          {canEdit &&
            isCharacterOwner &&
            track.status === TrackStatus.Active && (
              <Box>
                {trackCompletionMoveIds[track.type]?.map((moveId) => (
                  <TrackCompletionMoveButton
                    key={moveId}
                    moveId={moveId}
                    trackType={track.type}
                    trackLabel={track.label}
                    trackProgress={Math.min(track.value / 4)}
                  />
                ))}
              </Box>
            )}
          {canEdit && track.status === TrackStatus.Active && (
            <Button
              variant={"outlined"}
              color={"inherit"}
              onClick={() => handleStatusChange(TrackStatus.Completed)}
              endIcon={<CheckIcon />}
            >
              {t(
                "character.character-sidebar.tracks-progress-track-complete-button",
                "Complete Track",
              )}
            </Button>
          )}
          {canEdit && track.status === TrackStatus.Completed && (
            <Button
              variant={"outlined"}
              color={"inherit"}
              onClick={() => handleStatusChange(TrackStatus.Active)}
            >
              {t(
                "character.character-sidebar.tracks-progress-track-reopen-button",
                "Reopen Track",
              )}
            </Button>
          )}
          {canEdit && track.status === TrackStatus.Completed && (
            <Button color={"error"} onClick={handleDeleteClick}>
              {t(
                "character.character-sidebar.tracks-progress-track-delete-button",
                "Delete Permanently",
              )}
            </Button>
          )}
          {areSecondScreenSettingsActive && (
            <Button
              variant={"outlined"}
              color={"inherit"}
              onClick={() =>
                updateSecondScreen(
                  gameId,
                  isTrackOpenOnSecondScreen
                    ? null
                    : {
                        type: "track",
                        trackId,
                      },
                ).catch(() => {})
              }
            >
              {isTrackOpenOnSecondScreen
                ? t(
                    "character.character-sidebar.tracks-progress-track-close-second-screen",
                    "Close on Second Screen",
                  )
                : t(
                    "character.character-sidebar.tracks-progress-track-open-second-screen",
                    "Open on Second Screen",
                  )}
            </Button>
          )}
        </Box>
      </Box>
    </>
  );
}
