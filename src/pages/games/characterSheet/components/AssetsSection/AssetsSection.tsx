import { Box } from "@mui/material";
import { useMemo, useState } from "react";

import { GridLayout } from "components/Layout";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useAssetsStore } from "stores/assets.store";

import { filterObject } from "lib/filterObject";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter";
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

  const doesUserOwnCharacter = useIsOwnerOfCharacter();

  const [showAllAbilities, setShowAllAbilities] = useState(false);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <AssetSectionHeader
        gameId={gameId}
        characterId={characterId}
        showAllAbilities={showAllAbilities}
        setShowAllAbilities={setShowAllAbilities}
        lastCharacterAssetOrder={lastCharacterAssetOrder}
        lastSharedAssetOrder={lastSharedAssetOrder}
        doesUserOwnCharacter={doesUserOwnCharacter}
      />
      <GridLayout
        items={[...sortedSharedAssets, ...sortedCharacterAssets]}
        renderItem={(item, index) => (
          <AssetsSectionCard
            key={index}
            doesUserOwnCharacter={doesUserOwnCharacter}
            assetId={item[0]}
            assetDocument={item[1]}
            showUnavailableAbilities={showAllAbilities}
          />
        )}
        minWidth={300}
      />
    </Box>
  );
}
