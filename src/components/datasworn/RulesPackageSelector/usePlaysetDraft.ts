import { useState } from "react";

import { PlaysetConfig } from "repositories/game.repository";

import { PlaysetCollectionKey } from "./getReplacedCollectionsAndItems";

export type ExclusionMap = Record<string, boolean>;

export interface PlaysetDraft {
  disableAutomaticCursedDieRolls: boolean;
  /** Excluded collections, by kind. */
  collections: Record<PlaysetCollectionKey, ExclusionMap>;
  /** Excluded items, by kind. */
  items: Record<PlaysetCollectionKey, ExclusionMap>;
}

function toDraft(playset: PlaysetConfig): PlaysetDraft {
  const excludes = playset.excludes ?? {};
  return {
    disableAutomaticCursedDieRolls:
      playset.disableAutomaticCursedDieRolls ?? false,
    collections: {
      assets: excludes.assetCategories ?? {},
      moves: excludes.moveCategories ?? {},
      oracles: excludes.oracleCategories ?? {},
    },
    items: {
      assets: excludes.assets ?? {},
      moves: excludes.moves ?? {},
      oracles: excludes.oracles ?? {},
    },
  };
}

/** The saved playset with the draft's choices in it. */
export function applyPlaysetDraft(
  playset: PlaysetConfig,
  draft: PlaysetDraft,
): PlaysetConfig {
  return {
    ...playset,
    disableAutomaticCursedDieRolls: draft.disableAutomaticCursedDieRolls,
    excludes: {
      // Kept: exclusions this editor does not show.
      ...playset.excludes,
      assetCategories: draft.collections.assets,
      assets: draft.items.assets,
      moveCategories: draft.collections.moves,
      moves: draft.items.moves,
      oracleCategories: draft.collections.oracles,
      oracles: draft.items.oracles,
    },
  };
}

/**
 * The playset editor's unsaved choices, started from the saved playset each
 * time the dialog opens.
 */
export function usePlaysetDraft(playset: PlaysetConfig, open: boolean) {
  const [draft, setDraft] = useState(() => toDraft(playset));
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(toDraft(playset));
  }

  const setExcluded = (
    level: "collections" | "items",
    kind: PlaysetCollectionKey,
    id: string,
    isExcluded: boolean,
  ) =>
    setDraft((prev) => ({
      ...prev,
      [level]: {
        ...prev[level],
        [kind]: { ...prev[level][kind], [id]: isExcluded },
      },
    }));

  const setAutoRollCursedDie = (autoRoll: boolean) =>
    setDraft((prev) => ({
      ...prev,
      disableAutomaticCursedDieRolls: !autoRoll,
    }));

  return { draft, setExcluded, setAutoRollCursedDie };
}
