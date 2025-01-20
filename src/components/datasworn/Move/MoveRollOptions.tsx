import { Datasworn } from "@datasworn/core";
import { Box, Typography } from "@mui/material";
import { useMemo } from "react";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useAssetsStore } from "stores/assets.store";
import { useUID } from "stores/auth.store";
import { useDataswornTree } from "stores/dataswornTree.store";
import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { filterObject } from "lib/filterObject";

import { IAsset } from "services/asset.service";

import { AssetEnhancements } from "./AssetEnhancements";
import {
  ActionRolls,
  CharacterRollOptionState,
  ProgressRolls,
} from "./RollOptions";
import { SpecialTracks } from "./RollOptions/SpecialTracks";
import { extractRollOptions } from "./RollOptions/extractRollOptions";

export interface MoveRollOptions {
  move: Datasworn.Move;
}

export function MoveRollOptions(props: MoveRollOptions) {
  const { move } = props;
  const uid = useUID();
  const optionalCharacterId = useCharacterIdOptional();
  const optionalGameId = useGameIdOptional();

  const characterData = useGameCharactersStore((store) => {
    const characterData: Record<string, CharacterRollOptionState> = {};
    Object.entries(store.characters).forEach(([characterId, character]) => {
      if (
        uid &&
        uid === character?.uid &&
        (!optionalCharacterId || characterId === optionalCharacterId)
      ) {
        characterData[characterId] = {
          name: character?.name,
          stats: character?.stats,
          conditionMeters: character?.conditionMeters,
          adds: character.adds,
          momentum: character.momentum,
          specialTracks: character?.specialTracks,
        };
      }
    });
    return characterData;
  });

  const characterAssets = useAssetsStore((store) => {
    const characterAssets: Record<string, Record<string, IAsset>> = {};
    Object.entries(store.assets).forEach(([assetId, asset]) => {
      if (asset.characterId && characterData[asset.characterId]) {
        if (!characterAssets[asset.characterId]) {
          characterAssets[asset.characterId] = {};
        }
        characterAssets[asset.characterId][assetId] = asset;
      }
    });
    return characterAssets;
  });
  const gameAssets = useAssetsStore((store) =>
    filterObject(store.assets, (asset) =>
      optionalGameId ? asset.gameId === optionalGameId : false,
    ),
  );
  const gameConditionMeters = useGameStore(
    (store) => store.game?.conditionMeters ?? {},
  );

  const dataswornTree = useDataswornTree();

  const rollOptions = useMemo(
    () =>
      extractRollOptions(
        move,
        gameAssets,
        characterData,
        characterAssets,
        dataswornTree,
      ),
    [move, gameAssets, characterData, characterAssets, dataswornTree],
  );

  return (
    <Box>
      {rollOptions.visibleProgressTrack && (
        <ProgressRolls
          moveId={move._id}
          moveName={move.name}
          trackType={rollOptions.visibleProgressTrack}
        />
      )}
      <AssetEnhancements enhancements={rollOptions.sharedEnhancements} />
      {Object.entries(rollOptions.character).map(
        ([rollOptionCharacterId, characterRollOptions], idx) => (
          <Box
            key={rollOptionCharacterId}
            display="flex"
            flexDirection="column"
            mt={
              Object.keys(rollOptions.sharedEnhancements).length === 0 &&
              idx === 0
                ? 0
                : 1
            }
            gap={1}
          >
            {!optionalCharacterId && (
              <Typography variant="overline">
                {characterData[rollOptionCharacterId].name}
              </Typography>
            )}
            <AssetEnhancements
              enhancements={characterRollOptions.assetEnhancements}
            />
            {characterRollOptions.specialTracks && (
              <SpecialTracks
                moveId={move._id}
                moveName={move.name}
                tracks={characterRollOptions.specialTracks}
                characterData={characterData[rollOptionCharacterId]}
              />
            )}
            {characterRollOptions.actionRolls.length > 0 && (
              <ActionRolls
                moveId={move._id}
                actionRolls={characterRollOptions.actionRolls}
                character={{
                  id: rollOptionCharacterId,
                  data: characterData[rollOptionCharacterId],
                  assets: characterAssets[rollOptionCharacterId] ?? {},
                }}
                gameAssets={gameAssets}
                gameConditionMeters={gameConditionMeters}
                includeAdds
              />
            )}
          </Box>
        ),
      )}
    </Box>
  );
}
