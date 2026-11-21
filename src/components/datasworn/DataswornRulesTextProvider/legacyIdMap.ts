export type LegacyIdMap = Record<string, string | null>;

let loaded: LegacyIdMap | undefined;
let loading: Promise<LegacyIdMap> | undefined;

/**
 * Loads the map from pre-0.1 Datasworn ids to current ones. It is large and
 * only matters for links in older text, so it stays out of the entry chunk.
 */
export function loadLegacyIdMap(): Promise<LegacyIdMap> {
  loading ??= import("data/idMap").then((module) => {
    loaded = module.idMap;
    return module.idMap;
  });
  return loading;
}

/** The map, if it has loaded. */
export function getLoadedLegacyIdMap(): LegacyIdMap | undefined {
  return loaded;
}
