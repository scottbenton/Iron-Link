import { Track } from "@/components/datasworn/Track";
import { TrackProgressButtons } from "@/components/datasworn/Track/TrackProgressButtons";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useDebouncedSync } from "@/hooks/useDebouncedSync";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import { TrackStatus, TrackTypes } from "@/repositories/tracks.repository";
import { useSetAnnouncement } from "@/stores/appState.store";
import { useTracksStore } from "@/stores/tracks.store";
import { Box, Button, Card, Heading, Link, Tag, Text } from "@chakra-ui/react";
import { CheckIcon } from "lucide-react";
import { useCallback } from "react";

import { SceneChallengeClock } from "./SceneChallengeClock";
import { TrackClock } from "./TrackClock";
import { TrackCompletionMoveButton } from "./TrackCompletionMoveButton";
import { useTrackDialog } from "./TrackDialogProvider";
import { TrackSecondScreenToggleButton } from "./TrackSecondScreenToggleButton";
import { getTrackTypeLabel, trackCompletionMoveIds } from "./common";

export interface TrackItemProps {
  gameId: string;
  canEdit: boolean;
  trackId: string;
}

export function TrackItem(props: TrackItemProps) {
  const { canEdit, trackId } = props;

  const t = useGameTranslations();
  const track = useTracksStore((store) => store.tracks[trackId]);
  const isCharacterOwner = useIsOwnerOfCharacter();

  const { openClockDialog, openTrackDialog } = useTrackDialog();
  const openDialog = useCallback(() => {
    if (track.type === TrackTypes.Clock) {
      openClockDialog(track);
    } else {
      openTrackDialog(track.type, track);
    }
  }, [track, openClockDialog, openTrackDialog]);

  const persistTrackProgress = useTracksStore(
    (store) => store.updateTrackValue,
  );
  const handleTrackProgressChange = useCallback(
    (value: number) => {
      persistTrackProgress(trackId, value);
    },
    [persistTrackProgress, trackId],
  );
  const [trackProgress, setTrackProgress] = useDebouncedSync(
    handleTrackProgressChange,
    track.value,
  );

  const announce = useSetAnnouncement();
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

  if (!track) {
    return null;
  }

  return (
    <Card.Root variant="subtle" size="sm" h="100%">
      <Card.Body>
        <Box
          display="flex"
          alignItems={"baseline"}
          justifyContent={"space-between"}
        >
          <Heading
            as="p"
            size="sm"
            color="fg.muted"
            lineHeight={"1em"}
            textTransform={"uppercase"}
            id={`track-${trackId}-label`}
          >
            {track.status === TrackStatus.Completed && (
              <Tag.Root
                variant="subtle"
                colorPalette={"green"}
                mr={1}
                verticalAlign={"unset"}
              >
                <Tag.Label>
                  {t("character-sidebar.tracks-completed-tag", "Completed")}
                </Tag.Label>
              </Tag.Root>
            )}
            {getTrackTypeLabel(
              track.type,
              t,
              track.type !== TrackTypes.Clock ? track.difficulty : undefined,
            )}
          </Heading>
          {canEdit && (
            <Heading asChild size="md">
              <Link color={"inherit"} asChild ml={2} onClick={openDialog}>
                <button>{t("common.edit", "Edit")}</button>
              </Link>
            </Heading>
          )}
        </Box>
        <Box>
          <Heading mb={1} display={track.description ? "block" : "inline"}>
            {track.label}
          </Heading>
          <Text display="inline" color={"fg.muted"} whiteSpace={"pre-wrap"}>
            {track.description}
          </Text>
          {canEdit && track.type !== TrackTypes.Clock && (
            <TrackProgressButtons
              float="right"
              setValue={setTrackProgress}
              difficulty={track.difficulty}
            />
          )}
        </Box>
        {track.type !== TrackTypes.Clock ? (
          <>
            <Track
              value={trackProgress}
              labelId={`track-${trackId}-label`}
              mt={2}
            />
            {track.type === TrackTypes.SceneChallenge && (
              <SceneChallengeClock
                label={track.label}
                trackId={trackId}
                canEdit={canEdit}
                segmentsFilled={track.segmentsFilled}
                mt={2}
              />
            )}
          </>
        ) : (
          <TrackClock
            clock={track}
            clockId={trackId}
            canEdit={canEdit}
            mt={4}
          />
        )}
        <Box
          display="flex"
          flexDirection="column"
          gap={2}
          mt={2}
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
              variant={"outline"}
              colorPalette={"gray"}
              onClick={() => handleStatusChange(TrackStatus.Completed)}
            >
              {t(
                "character.character-sidebar.tracks-progress-track-complete-button",
                "Complete",
              )}
              <CheckIcon />
            </Button>
          )}
          {canEdit && track.status === TrackStatus.Completed && (
            <Button
              variant={"outline"}
              colorPalette={"gray"}
              onClick={() => handleStatusChange(TrackStatus.Active)}
            >
              {t(
                "character.character-sidebar.tracks-progress-track-reopen-button",
                "Reopen Track",
              )}
            </Button>
          )}
          {canEdit && track.status === TrackStatus.Completed && (
            <Button colorPalette={"red"} onClick={() => {}} variant={"subtle"}>
              {t(
                "character.character-sidebar.tracks-progress-track-delete-button",
                "Delete Permanently",
              )}
            </Button>
          )}
          <TrackSecondScreenToggleButton trackId={trackId} />
        </Box>
      </Card.Body>
    </Card.Root>
  );
}
