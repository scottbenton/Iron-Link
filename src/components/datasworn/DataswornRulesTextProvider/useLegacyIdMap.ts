import { useEffect, useState } from "react";

import {
  LegacyIdMap,
  getLoadedLegacyIdMap,
  loadLegacyIdMap,
} from "./legacyIdMap";

/** The pre-0.1 id map, undefined until it has loaded. */
export function useLegacyIdMap(): LegacyIdMap | undefined {
  const [idMap, setIdMap] = useState(getLoadedLegacyIdMap);

  useEffect(() => {
    if (idMap) return;
    let cancelled = false;
    loadLegacyIdMap().then((map) => {
      if (!cancelled) setIdMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [idMap]);

  return idMap;
}
