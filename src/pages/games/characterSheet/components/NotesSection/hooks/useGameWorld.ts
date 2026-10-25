import { useEffect, useRef } from "react";

import { useAdvancedFeatureToggle } from "hooks/advancedFeatures/advancedFeatures";

import { GamePermission, useGameStore } from "stores/game.store";
import { useNotesStore } from "stores/notes.store";
import { useListenToWorld, useWorldStore } from "stores/world.store";
import { useListenToWorldConfiguration } from "stores/worldCategories.store";
import { useListenToWorldEntries } from "stores/worldEntries.store";
import { useListenToWorldOracles } from "stores/worldOracles.store";

// The world linked to the current game, or undefined when the worlds feature
// is turned off or the game has no world.
export function useGameWorldId(): string | undefined {
  const worldsEnabled = useAdvancedFeatureToggle("worlds");
  const worldId = useGameStore((store) => store.game?.worldId ?? undefined);

  return worldsEnabled ? worldId : undefined;
}

// The single owner of the world, its configuration, its oracles, and its
// entries (with their field values) inside a game. Their listeners do not de-duplicate and their cleanups reset the
// stores, so this is mounted once at the top of the notes section; everything
// below it (the world row, the world tabs) reads the stores instead, and
// reopening a world tab needs no loading.
export function useListenToGameWorld(): void {
  const worldId = useGameWorldId();
  useListenToWorld(worldId);
  useListenToWorldConfiguration(worldId);
  useListenToWorldOracles(worldId);
  useListenToWorldEntries(worldId);
  const loadedWorldId = useWorldStore((store) => store.world?.id);
  const worldDeleted = useWorldStore((store) => store.worldDeleted);
  const closeTabsMatching = useNotesStore((store) => store.closeTabsMatching);
  const previousWorldId = useRef(worldId);
  useEffect(() => {
    // This owner survives inactive Notes tabs. Close every destination when
    // deletion or a changed game link makes that world unavailable.
    const previous = previousWorldId.current;
    previousWorldId.current = worldId;
    if (previous && previous !== worldId) closeTabsMatching("world", previous);
    if (worldId && loadedWorldId === worldId && worldDeleted) {
      closeTabsMatching("world", worldId);
    }
  }, [worldId, loadedWorldId, worldDeleted, closeTabsMatching]);
}

// Whether the root folder shows the world at all: the linked world's section,
// or, with no world linked, the tile inviting a Guide to link one. Players
// who cannot link would otherwise see an inert advertisement.
export function useShowWorldItem(): boolean {
  const worldId = useGameWorldId();
  const worldsEnabled = useAdvancedFeatureToggle("worlds");
  const isGuide = useGameStore(
    (store) => store.gamePermissions === GamePermission.Guide,
  );

  return worldsEnabled && (!!worldId || isGuide);
}
