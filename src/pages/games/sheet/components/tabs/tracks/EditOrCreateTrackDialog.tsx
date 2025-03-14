import { Dialog } from "@/components/common/Dialog";
import { Select, TextField } from "@/components/common/TextField";
import { Checkbox } from "@/components/ui/checkbox";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameId } from "@/hooks/useGameId";
import {
  Difficulty,
  TrackSectionProgressTracks,
  TrackTypes,
} from "@/repositories/tracks.repository";
import { IProgressTrack, ISceneChallenge } from "@/services/tracks.service";
import { useTracksStore } from "@/stores/tracks.store";
import { Alert, Button, Stack } from "@chakra-ui/react";
import { TFunction } from "i18next";
import { useEffect, useState } from "react";

import { getTrackDifficultyLabel } from "./common";

export interface EditOrCreateTrackDialogProps {
  open: boolean;
  handleClose: () => void;
  initialTrack?: ISceneChallenge | IProgressTrack;
  trackType: TrackSectionProgressTracks | TrackTypes.SceneChallenge;
}

export function EditOrCreateTrackDialog(props: EditOrCreateTrackDialogProps) {
  const { open, handleClose, initialTrack, trackType } = props;
  const t = useGameTranslations();

  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  const [track, setTrack] = useState<Partial<IProgressTrack | ISceneChallenge>>(
    initialTrack ?? { type: trackType },
  );
  const [resetProgress, setResetProgress] = useState(false);

  const gameId = useGameId();

  useEffect(() => {
    setTrack(initialTrack ?? { type: trackType });
  }, [initialTrack, trackType]);

  const handleDialogClose = () => {
    setTrack({});
    setError(undefined);
    setLoading(false);
    handleClose();
  };

  const addProgressTrack = useTracksStore((store) => store.addProgressTrack);
  const updateProgressTrack = useTracksStore(
    (store) => store.updateProgressTrack,
  );
  const addSceneChallenge = useTracksStore((store) => store.addSceneChallenge);
  const updateSceneChallenge = useTracksStore(
    (store) => store.updateSceneChallenge,
  );

  const handleSubmit = () => {
    const potentialError = verifyTrack(track, t);
    if (potentialError) {
      setError(potentialError);
      return;
    }

    setLoading(true);
    if (initialTrack) {
      let updatePromise: Promise<void>;
      if (trackType === TrackTypes.SceneChallenge) {
        updatePromise = updateSceneChallenge(
          initialTrack.id,
          track.label ?? "",
          track.description,
          track.difficulty ?? Difficulty.Troublesome,
          resetProgress,
        );
      } else {
        updatePromise = updateProgressTrack(
          initialTrack.id,
          track.label ?? "",
          track.description,
          track.difficulty ?? Difficulty.Troublesome,
          resetProgress,
        );
      }
      updatePromise
        .then(() => {
          handleDialogClose();
        })
        .catch(() => {
          setLoading(false);
          setError(
            t(
              "character.character-sidebar.track-update-error",
              "Error updating track",
            ),
          );
        });
    } else {
      let addPromise: Promise<string>;
      if (trackType === TrackTypes.SceneChallenge) {
        addPromise = addSceneChallenge(
          gameId,
          track.label ?? "",
          track.description,
          track.difficulty ?? Difficulty.Troublesome,
        );
      } else {
        addPromise = addProgressTrack(
          gameId,
          trackType,
          track.label ?? "",
          track.description,
          track.difficulty ?? Difficulty.Troublesome,
        );
      }
      addPromise
        .then(() => {
          handleDialogClose();
        })
        .catch(() => {
          setLoading(false);
          setError(
            t(
              "character.character-sidebar.track-add-error",
              "Error adding track",
            ),
          );
        });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      size={"xs"}
      title={
        initialTrack
          ? t("track-tab.edit-track-title", "Edit Track")
          : t("track-tab.add-track-title", "Add Track")
      }
      content={
        <Stack gap={4}>
          {error && (
            <Alert.Root status={"error"}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t("common.error", "Error")}</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
          <TextField
            label={t("track-tab.track-title-input", "Title")}
            required
            value={track.label ?? ""}
            onChange={(label) => setTrack((prev) => ({ ...prev, label }))}
          />
          <TextField
            label={t("track-tab.track-description-input", "Description")}
            value={track.description ?? ""}
            onChange={(description) =>
              setTrack((prev) => ({ ...prev, description }))
            }
          />
          <Select
            label={t("track-tab.track-difficulty-input", "Difficulty")}
            value={track.difficulty ?? "-1"}
            onChange={(difficulty) =>
              setTrack((prev) => ({
                ...prev,
                difficulty: difficulty as Difficulty,
              }))
            }
            required
            options={[
              {
                label: getTrackDifficultyLabel(Difficulty.Troublesome, t),
                value: Difficulty.Troublesome,
              },
              {
                label: getTrackDifficultyLabel(Difficulty.Dangerous, t),
                value: Difficulty.Dangerous,
              },
              {
                label: getTrackDifficultyLabel(Difficulty.Formidable, t),
                value: Difficulty.Formidable,
              },
              {
                label: getTrackDifficultyLabel(Difficulty.Extreme, t),
                value: Difficulty.Extreme,
              },
              {
                label: getTrackDifficultyLabel(Difficulty.Epic, t),
                value: Difficulty.Epic,
              },
            ]}
          />
          {initialTrack && initialTrack.difficulty !== track.difficulty && (
            <Checkbox
              checked={resetProgress}
              onCheckedChange={({ checked }) =>
                setResetProgress(checked === true)
              }
            >
              {t(
                "track-tab.reset-track-progress-checkbox",
                "Reset Track Progress",
              )}
            </Checkbox>
          )}
        </Stack>
      }
      actions={
        <>
          <Button
            disabled={loading}
            onClick={() => handleDialogClose()}
            colorPalette={"gray"}
            variant="ghost"
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button disabled={loading} onClick={() => handleSubmit()}>
            {initialTrack
              ? t("character.character-sidebar.edit-track-button", "Edit Track")
              : t("character.character-sidebar.add-track-button", "Add Track")}
          </Button>
        </>
      }
    />
  );
}

function verifyTrack(
  track: Partial<IProgressTrack | ISceneChallenge>,
  t: TFunction,
): string | undefined {
  // track.type === TrackTypes.Clock && track.
  if (!track.label) {
    return t(
      "character.character-sidebar.track-label-required-error",
      "Label is required",
    );
  } else if (!(track as IProgressTrack).difficulty) {
    return t(
      "character.character-sidebar.track-difficulty-required-error",
      "Difficulty is required",
    );
  }
}
