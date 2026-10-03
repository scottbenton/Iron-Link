import { useEffect, useRef } from "react";

import { useAdvancedFeatureToggle } from "hooks/advancedFeatures/advancedFeatures";

import { GamePermission, useGameStore } from "stores/game.store";
import { useNotesStore } from "stores/notes.store";
import { useListenToWorld, useWorldStore } from "stores/world.store";
import { useListenToWorldCategories } from "stores/worldCategories.store";

// The world linked to the current game, or undefined when the worlds feature
// is turned off or the game has no world.
export function useGameWorldId(): string | undefined {
  const worldsEnabled = useAdvancedFeatureToggle("worlds");
  const worldId = useGameStore((store) => store.game?.worldId ?? undefined);

  return worldsEnabled ? worldId : undefined;
}

// The single owner of the world subscription inside a game. `useListenToWorld`
// does not de-duplicate, and its cleanup resets the whole world store, so this
// is mounted once at the top of the notes section; everything below it (the
// world row, the world tab) reads the store instead of subscribing again.
export function useListenToGameWorld(): void {
  const worldId = useGameWorldId();
  useListenToWorld(worldId);
  useListenToWorldCategories(worldId);
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

// Whether the world tile belongs in the folder grid at all. Hoisted out of
// WorldItem so FolderView can decide whether to reserve a grid slot -- a tile
// that renders null would otherwise leave a gap as the first item.
//
// With no world linked the tile is only an invitation to link one, so players
// who cannot link would just see an inert advertisement.
export function useShowWorldItem(): boolean {
  const worldId = useGameWorldId();
  const worldsEnabled = useAdvancedFeatureToggle("worlds");
  const isGuide = useGameStore(
    (store) => store.gamePermissions === GamePermission.Guide,
  );

  return worldsEnabled && (!!worldId || isGuide);
}
