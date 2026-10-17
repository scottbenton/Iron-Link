import { useMemo } from "react";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  type WorldFieldEntrySnapshots,
  buildWorldFieldEntrySnapshots,
} from "lib/worldFieldSnapshot";

// Every loaded entry and its values, as field rules see them. Rebuilt only
// when the entries or values change.
export function useWorldFieldEntrySnapshots(): WorldFieldEntrySnapshots {
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const valuesByEntry = useWorldEntriesStore(
    (store) => store.fieldValueState.valuesByEntry,
  );
  return useMemo(
    () => buildWorldFieldEntrySnapshots(entries, valuesByEntry),
    [entries, valuesByEntry],
  );
}
