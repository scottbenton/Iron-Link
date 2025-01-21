import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useAssetsStore } from "stores/assets.store";

import { filterObject } from "../../../lib/filterObject";

export function useActiveAssets() {
  const gameId = useGameIdOptional();
  const characterId = useCharacterIdOptional();

  const characterAssets = useAssetsStore((store) =>
    characterId
      ? filterObject(store.assets, (asset) => asset.characterId === characterId)
      : {},
  );
  const gameAssets = useAssetsStore((store) =>
    filterObject(store.assets, (asset) => asset.gameId === gameId),
  );

  return { characterAssets, gameAssets };
}
