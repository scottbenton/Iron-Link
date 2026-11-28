import { Datasworn } from "@datasworn-community/core";
import { useMemo } from "react";

import { Stack } from "ui/primitives";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useAssetsStore } from "stores/assets.store";
import { useUID } from "stores/auth.store";
import { getCharacterAccess } from "stores/characterAccess";
import { useDataswornTree } from "stores/dataswornTree.store";
import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { filterObject } from "lib/filterObject";

import { IAsset } from "services/asset.service";

import { AssetEnhancements } from "./AssetEnhancements";
import { CharacterRollOptionState, ProgressRolls } from "./RollOptions";
import { CharacterRollOptions } from "./RollOptions/CharacterRollOptions";
import { extractRollOptions } from "./RollOptions/extractRollOptions";

export interface MoveRollOptions {
  move: Datasworn.AnyMove;
}

export function MoveRollOptions(props: MoveRollOptions) {
  const { move } = props;
  const uid = useUID();
  const optionalCharacterId = useCharacterIdOptional();
  const optionalGameId = useGameIdOptional();

  const gamePermission = useGameStore((store) => store.gamePermissions);

  // Off a sheet, rolls are offered for your own characters. On a sheet, for
  // that character whenever you can edit it, including one shared with you.
  const characterData = useGameCharactersStore((store) => {
    const characterData: Record<string, CharacterRollOptionState> = {};
    Object.entries(store.characters).forEach(([characterId, character]) => {
      const canRoll = optionalCharacterId
        ? characterId === optionalCharacterId &&
          getCharacterAccess({
            uid,
            ownerId: character?.uid,
            editPermissions: character?.editPermissions,
            gamePermission,
          }).canEdit
        : !!uid && uid === character?.uid;
      if (canRoll) {
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
    <Stack gap="4">
      {rollOptions.visibleProgressTrack && (
        <ProgressRolls
          moveId={move._id}
          moveName={move.name}
          trackType={rollOptions.visibleProgressTrack}
        />
      )}
      <AssetEnhancements enhancements={rollOptions.sharedEnhancements} />
      {Object.entries(rollOptions.character).map(
        ([rollOptionCharacterId, characterRollOptions]) => (
          <CharacterRollOptions
            key={rollOptionCharacterId}
            move={move}
            // Off a sheet, each character's rolls show under its name.
            showName={!optionalCharacterId}
            characterId={rollOptionCharacterId}
            characterData={characterData[rollOptionCharacterId]}
            characterAssets={characterAssets[rollOptionCharacterId] ?? {}}
            rollOptions={characterRollOptions}
            gameAssets={gameAssets}
            gameConditionMeters={gameConditionMeters}
          />
        ),
      )}
    </Stack>
  );
}
