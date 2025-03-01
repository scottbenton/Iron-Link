import { useAssetsStore } from "@/stores/assets.store";

import { filterObject } from "@/lib/filterObject";
import { useGameIdOptional } from "@/hooks/useGameId";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";

export function useActiveAssets() {
  const gameId = useGameIdOptional();
  const characterId = useCharacterIdOptional();

  const characterAssets = useAssetsStore((store) =>
    characterId
      ? filterObject(store.assets, (asset) => asset.characterId === characterId)
      : {}
  );
  const gameAssets = useAssetsStore((store) =>
    filterObject(store.assets, (asset) => asset.gameId === gameId)
  );

  return { characterAssets, gameAssets };
}
