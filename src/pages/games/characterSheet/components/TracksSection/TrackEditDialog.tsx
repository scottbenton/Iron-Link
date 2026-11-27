import { useState } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "ui/components/Toast";
import {
  TrackDialog,
  TrackDialogValues,
  TrackKind,
  TracksPanelStrings,
} from "ui/game/TracksPanel";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useTracksStore } from "stores/tracks.store";

import { TrackTypes } from "repositories/tracks.repository";

import { getDifficulty, toTrackItem, typeByKind } from "./trackMappings";

export interface TrackEditDialogProps {
  open: boolean;
  onClose: () => void;
  /** What it adds, or the kind of the track it edits. */
  kind: TrackKind;
  /** The track to edit; adds a new one without it. */
  trackId?: string;
  strings?: Partial<TracksPanelStrings>;
}

/**
 * Adds or edits one of the game's tracks or clocks in the library dialog.
 * Give it a new `key` each time it opens, for a fresh form.
 */
export function TrackEditDialog(props: TrackEditDialogProps) {
  const { open, onClose, kind, trackId, strings } = props;
  const { t } = useTranslation();
  const gameId = useGameId();

  const storedTrack = useTracksStore((store) =>
    trackId ? store.tracks[trackId] : undefined,
  );
  const track = storedTrack ? toTrackItem(storedTrack) : undefined;

  const [saving, setSaving] = useState(false);

  const save = (values: TrackDialogValues): Promise<unknown> => {
    const {
      addClock,
      updateClock,
      addSceneChallenge,
      updateSceneChallenge,
      addProgressTrack,
      updateProgressTrack,
    } = useTracksStore.getState();
    const { label, description, rank, segments } = values;
    const resetProgress = values.resetProgress ?? false;
    const type = typeByKind[kind];

    if (type === TrackTypes.Clock) {
      return trackId
        ? updateClock(trackId, label, description, segments ?? 6)
        : addClock(gameId, label, description, segments ?? 6);
    }

    const difficulty = getDifficulty(rank ?? "dangerous");
    if (type === TrackTypes.SceneChallenge) {
      return trackId
        ? updateSceneChallenge(
            trackId,
            label,
            description,
            difficulty,
            resetProgress,
          )
        : addSceneChallenge(gameId, label, description, difficulty);
    }
    return trackId
      ? updateProgressTrack(
          trackId,
          label,
          description,
          difficulty,
          resetProgress,
        )
      : addProgressTrack(gameId, type, label, description, difficulty);
  };

  const handleSave = (values: TrackDialogValues) => {
    if (saving) return;
    setSaving(true);
    save(values)
      .then(() => {
        setSaving(false);
        onClose();
      })
      .catch(() => {
        setSaving(false);
        toast.error(
          trackId
            ? t(
                "character.character-sidebar.track-update-error",
                "Error updating track",
              )
            : t(
                "character.character-sidebar.track-add-error",
                "Error adding track",
              ),
        );
      });
  };

  return (
    <TrackDialog
      open={open}
      onClose={onClose}
      kind={kind}
      track={track}
      onSave={handleSave}
      saving={saving}
      strings={strings}
    />
  );
}
