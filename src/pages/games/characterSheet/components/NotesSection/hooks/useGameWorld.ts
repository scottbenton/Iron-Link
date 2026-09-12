import { useAdvancedFeatureToggle } from "hooks/advancedFeatures/advancedFeatures";

import { GamePermission, useGameStore } from "stores/game.store";
import { useListenToWorld } from "stores/world.store";

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
  useListenToWorld(useGameWorldId());
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
