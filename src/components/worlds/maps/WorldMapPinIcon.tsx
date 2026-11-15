import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryIcon } from "../entries/WorldEntryIcon";

// A pin's icon: the entry's picture or icon, else one for its Location Type,
// else its category's icon, as everywhere else the entry shows.
export function WorldMapPinIcon({ entry }: { entry: IWorldEntry }) {
  return <WorldEntryIcon entry={entry} size="small" />;
}
