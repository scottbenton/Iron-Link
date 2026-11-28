import { useMemo, useState } from "react";

import { Grid, Stack } from "ui/primitives";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useAssetsStore } from "stores/assets.store";

import { filterObject } from "lib/filterObject";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { AssetSectionHeader } from "./AssetSectionHeader";
import { AssetsSectionCard } from "./AssetsSectionCard";

export function AssetsSection() {
  const characterId = useCharacterIdOptional();
  const gameId = useGameId();

  const sortedCharacterAssets = useAssetsStore((store) => {
    return Object.entries(
      characterId
        ? filterObject(
            store.assets,
            (asset) => asset.characterId === characterId,
          )
        : {},
    ).sort(([, a], [, b]) => {
      return a.order - b.order;
    });
  });
  const lastCharacterAssetOrder = useMemo(() => {
    if (sortedCharacterAssets.length !== 0) {
      return sortedCharacterAssets[sortedCharacterAssets.length - 1][1].order;
    }
    return 0;
  }, [sortedCharacterAssets]);

  const sortedSharedAssets = useAssetsStore((store) => {
    return Object.entries(
      filterObject(store.assets, (asset) =>
        gameId ? asset.gameId === gameId : false,
      ),
    ).sort(([, a], [, b]) => {
      return a.order - b.order;
    });
  });
  const lastSharedAssetOrder = useMemo(() => {
    if (sortedSharedAssets.length !== 0) {
      return sortedSharedAssets[sortedSharedAssets.length - 1][1].order;
    }
    return 0;
  }, [sortedSharedAssets]);

  const canEditCharacter = useCanEditCharacter();

  const [showAllAbilities, setShowAllAbilities] = useState(false);

  return (
    <Stack gap="3">
      <AssetSectionHeader
        gameId={gameId}
        characterId={characterId}
        showAllAbilities={showAllAbilities}
        setShowAllAbilities={setShowAllAbilities}
        lastCharacterAssetOrder={lastCharacterAssetOrder}
        lastSharedAssetOrder={lastSharedAssetOrder}
        canEditCharacter={canEditCharacter}
      />
      {/* As many cards to a row as fit at 300px. */}
      <Grid
        gridTemplateColumns="repeat(auto-fill, minmax(min(100%, 300px), 1fr))"
        gap="3"
      >
        {[...sortedSharedAssets, ...sortedCharacterAssets].map(
          ([assetId, assetDocument]) => (
            <AssetsSectionCard
              key={assetId}
              canEditCharacter={canEditCharacter}
              assetId={assetId}
              assetDocument={assetDocument}
              showUnavailableAbilities={showAllAbilities}
            />
          ),
        )}
      </Grid>
    </Stack>
  );
}
