import {
  TrackSectionProgressTracks,
  TrackTypes,
} from "@/repositories/tracks.repository";
import {
  IClock,
  IProgressTrack,
  ISceneChallenge,
} from "@/services/tracks.service";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import { EditOrCreateClockDialog } from "./EditOrCreateClockDialog";
import { EditOrCreateTrackDialog } from "./EditOrCreateTrackDialog";

const TrackDialogContext = createContext<{
  openTrackDialog: (
    trackType: TrackTypes.SceneChallenge | TrackSectionProgressTracks,
    existingTrack?: IProgressTrack | ISceneChallenge,
  ) => void;
  openClockDialog: (existingClock?: IClock) => void;
}>({
  openTrackDialog: () => {},
  openClockDialog: () => {},
});

export function useTrackDialog() {
  return useContext(TrackDialogContext);
}

export function TrackDialogProvider(props: PropsWithChildren) {
  const { children } = props;

  const [trackDialogState, setTrackDialogState] = useState<{
    open: boolean;
    trackType: TrackTypes.SceneChallenge | TrackSectionProgressTracks;
    existingTrack?: IProgressTrack | ISceneChallenge;
  }>({ open: false, trackType: TrackTypes.Vow });
  const openTrackDialog = useCallback(
    (
      trackType: TrackTypes.SceneChallenge | TrackSectionProgressTracks,
      existingTrack?: IProgressTrack | ISceneChallenge,
    ) => {
      setTrackDialogState({ open: true, trackType, existingTrack });
    },
    [],
  );
  const closeTrackDialog = useCallback(() => {
    setTrackDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  const [clockDialogState, setClockDialogState] = useState<{
    open: boolean;
    existingClock?: IClock;
  }>({ open: false });
  const closeClockDialog = useCallback(() => {
    setClockDialogState((prev) => ({ ...prev, open: false }));
  }, []);
  const openClockDialog = useCallback((existingClock?: IClock) => {
    setClockDialogState({ open: true, existingClock });
  }, []);

  return (
    <TrackDialogContext.Provider value={{ openTrackDialog, openClockDialog }}>
      {children}
      <EditOrCreateTrackDialog
        open={trackDialogState.open}
        handleClose={closeTrackDialog}
        trackType={trackDialogState.trackType}
        initialTrack={trackDialogState.existingTrack}
      />
      <EditOrCreateClockDialog
        open={clockDialogState.open}
        handleClose={closeClockDialog}
        initialClock={clockDialogState.existingClock}
      />
    </TrackDialogContext.Provider>
  );
}
