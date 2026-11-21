import { XPMeter } from "../../game/ConditionMeter";
import { ProgressTrack } from "../../game/ProgressTrack";
import { legacyTracks, stackStyles } from "./playLayoutsShared";
import { PlaySheet } from "./usePlaySheet";

export function Legacy(props: { sheet: PlaySheet }) {
  const { sheet } = props;
  return (
    <div className={stackStyles}>
      {legacyTracks.map((track) => (
        <ProgressTrack
          key={track.key}
          label={track.label}
          ticks={sheet.legacyTicks[track.key]}
          onChange={(ticks) => sheet.setLegacyTicks(track.key, ticks)}
          legacy
        />
      ))}
      <XPMeter
        label="Unspent Experience"
        value={sheet.xp}
        onChange={sheet.setXp}
      />
    </div>
  );
}
