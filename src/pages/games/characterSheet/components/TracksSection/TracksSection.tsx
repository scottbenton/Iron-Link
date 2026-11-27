import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Spinner } from "ui/components/Spinner";
import {
  TrackKind,
  TracksPanel,
  TracksPanelStrings,
} from "ui/game/TracksPanel";
import { Stack } from "ui/primitives";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";
import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import { GamePermission } from "stores/game.store";
import { useSecondScreenStore } from "stores/secondScreen.store";
import { useTracksStore } from "stores/tracks.store";

import { TrackStatus, TrackTypes } from "repositories/tracks.repository";

import { ITrack } from "services/tracks.service";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { CharacterConnections } from "./CharacterConnections";
import { CharacterWorldBonds } from "./CharacterWorldBonds";
import { TrackEditDialog } from "./TrackEditDialog";
import { getTrackTypeLabel } from "./common";
import { oracleByOdds, toTrackItem, toTrackItems } from "./trackMappings";
import {
  PendingTrackField,
  usePendingTrackValues,
} from "./usePendingTrackValues";
import { useRollClockProgress } from "./useRollClockProgress";
import { useTrackCompletionMoves } from "./useTrackCompletionMoves";

/** A track's saved boxes, or a clock's or tension clock's saved segments. */
function savedValue(track: ITrack | undefined, field: PendingTrackField) {
  if (!track) return undefined;
  if (field === "ticks") {
    return track.type === TrackTypes.Clock ? undefined : track.value;
  }
  if (track.type === TrackTypes.Clock) return track.value;
  if (track.type === TrackTypes.SceneChallenge) return track.segmentsFilled;
  return undefined;
}

interface DialogState {
  open: boolean;
  kind: TrackKind;
  trackId?: string;
  /** Remounts the form each time it opens. */
  key: number;
}

/**
 * The character column's Tracks tab: the game's tracks and clocks on the
 * library Tracks panel, then the character's bonds and connections.
 */
export function TracksSection() {
  const { t } = useTranslation();
  const gameId = useGameId();

  const tracks = useTracksStore((store) => store.tracks);
  const loading = useTracksStore((store) => store.loading);
  const showCompleted = useTracksStore((store) => store.showCompletedTracks);
  const setShowCompleted = useTracksStore(
    (store) => store.setShowCompletedTracks,
  );
  const updateTrackValue = useTracksStore((store) => store.updateTrackValue);
  const updateClockValue = useTracksStore(
    (store) => store.updateClockFilledSegments,
  );
  const updateTrackStatus = useTracksStore((store) => store.updateTrackStatus);
  const updateClockOracle = useTracksStore(
    (store) => store.updateClockSelectedOracle,
  );
  const deleteTrack = useTracksStore((store) => store.deleteTrack);

  const canEdit = useGamePermissions().gamePermission !== GamePermission.Viewer;
  const canEditCharacter = useCanEditCharacter();

  // Clicks show at once and save once they stop, as the MUI tracks did.
  const pending = usePendingTrackValues(
    (id, field, value) =>
      field === "ticks"
        ? updateTrackValue(id, value)
        : updateClockValue(id, value),
    (id, field) => savedValue(tracks[id], field),
  );
  const { valueOf, change, changeNow } = pending;
  const items = toTrackItems(tracks).map((item) => {
    if (item.kind === "clock") {
      return { ...item, value: valueOf(item.id, "segments", item.value) };
    }
    return {
      ...item,
      ticks: valueOf(item.id, "ticks", item.ticks),
      tension:
        item.tension === undefined
          ? undefined
          : valueOf(item.id, "segments", item.tension),
    };
  });

  const completionMoves = useTrackCompletionMoves();
  const rollCompletion = useRollCompleteProgressTrack();
  const rollClockProgress = useRollClockProgress(
    (id, saved) => valueOf(id, "segments", saved),
    (id, value) => changeNow(id, "segments", value),
  );

  const secondScreenEnabled = useSecondScreenFeature();
  const secondScreenTrackId = useSecondScreenStore((store) =>
    store.settings?.type === "track" ? store.settings.trackId : null,
  );
  const updateSecondScreen = useSecondScreenStore(
    (store) => store.updateSecondScreenSettings,
  );

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    kind: "vow",
    key: 0,
  });
  const openDialog = (kind: TrackKind, trackId?: string) =>
    setDialog((prev) => ({ open: true, kind, trackId, key: prev.key + 1 }));

  // The app's own names for each kind ("Iron Vow", "Journey / Expedition").
  const strings: Partial<TracksPanelStrings> = {
    kindLabels: {
      vow: getTrackTypeLabel(TrackTypes.Vow, t),
      journey: getTrackTypeLabel(TrackTypes.Journey, t),
      combat: getTrackTypeLabel(TrackTypes.Fray, t),
      sceneChallenge: getTrackTypeLabel(TrackTypes.SceneChallenge, t),
      clock: getTrackTypeLabel(TrackTypes.Clock, t),
    },
  };

  const swallow = (promise: Promise<unknown>) => {
    promise.catch(() => {});
  };

  return (
    <Stack gap="6">
      {loading ? (
        <Spinner
          label={t(
            "character.character-sidebar.tracks-loading",
            "Loading tracks",
          )}
        />
      ) : (
        <TracksPanel
          tracks={items}
          readOnly={!canEdit}
          showCompleted={showCompleted}
          onShowCompletedChange={setShowCompleted}
          addKinds={["vow", "combat", "journey", "sceneChallenge", "clock"]}
          onAdd={(kind) => openDialog(kind)}
          onTicksChange={(id, ticks) => change(id, "ticks", ticks)}
          onClockChange={(id, value) => change(id, "segments", value)}
          completionMoves={completionMoves}
          onRollMove={
            canEditCharacter
              ? (id, moveId) => {
                  const track = tracks[id];
                  if (!track) return;
                  rollCompletion(
                    track.type,
                    track.label,
                    valueOf(id, "ticks", track.value),
                    moveId,
                  );
                }
              : undefined
          }
          onRollClock={rollClockProgress}
          onOddsChange={(id, odds) =>
            swallow(updateClockOracle(id, oracleByOdds[odds]))
          }
          onEdit={(id) => {
            const track = tracks[id];
            const kind = track && toTrackItem(track)?.kind;
            if (kind) openDialog(kind, id);
          }}
          onCompletedChange={(id, completed) =>
            swallow(
              updateTrackStatus(
                id,
                completed ? TrackStatus.Completed : TrackStatus.Active,
              ),
            )
          }
          onDelete={(id) => swallow(deleteTrack(id))}
          secondScreenTrackId={secondScreenEnabled ? secondScreenTrackId : null}
          onSecondScreenChange={
            secondScreenEnabled
              ? (id, open) =>
                  swallow(
                    updateSecondScreen(
                      gameId,
                      open ? { type: "track", trackId: id } : null,
                    ),
                  )
              : undefined
          }
          strings={strings}
        />
      )}
      <TrackEditDialog
        key={dialog.key}
        open={dialog.open}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
        kind={dialog.kind}
        trackId={dialog.trackId}
        strings={strings}
      />
      <CharacterWorldBonds />
      <CharacterConnections />
    </Stack>
  );
}
