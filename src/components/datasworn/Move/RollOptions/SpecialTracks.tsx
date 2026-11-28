import { capitalize } from "ui/game/shared";
import { Stack } from "ui/primitives";

import { useRollCompleteSpecialTrack } from "pages/games/hooks/useRollCompleteSpecialTrack";

import { useSpecialTrackRules } from "stores/dataswornTree.store";

import { TrackRoll } from "./TrackRoll";
import { CharacterRollOptionState } from "./common.types";

export interface SpecialTracksProps {
  moveId: string;
  moveName: string;
  tracks: string[];
  characterData: CharacterRollOptionState;
}

// The legacy tracks a move rolls for one character, each with its roll.
export function SpecialTracks(props: SpecialTracksProps) {
  const { moveId, moveName, tracks, characterData } = props;
  const specialTracks = useSpecialTrackRules();
  const rollTrackProgress = useRollCompleteSpecialTrack();

  if (tracks.length === 0) return null;

  return (
    <Stack gap="4">
      {tracks.map((trackId) => {
        const label = capitalize(specialTracks[trackId].label);
        const ticks = characterData.specialTracks?.[trackId]?.value ?? 0;
        return (
          <TrackRoll
            key={trackId}
            moveName={moveName}
            label={label}
            ticks={ticks}
            legacy
            onRoll={() => rollTrackProgress(trackId, label, ticks, moveId)}
          />
        );
      })}
    </Stack>
  );
}
