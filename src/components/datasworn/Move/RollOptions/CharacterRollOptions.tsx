import { Datasworn } from "@datasworn-community/core";
import { useId } from "react";

import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import { IAsset } from "services/asset.service";

import { AssetEnhancements } from "../AssetEnhancements";
import { ActionRolls } from "./ActionRolls";
import { SpecialTracks } from "./SpecialTracks";
import { CharacterRollOptionState } from "./common.types";
import { RollOptionGroup } from "./extractRollOptions";

export interface CharacterRollOptionsProps {
  move: Datasworn.AnyMove;
  // Names the character above its rolls, where more than one could show.
  showName: boolean;
  characterId: string;
  characterData: CharacterRollOptionState;
  characterAssets: Record<string, IAsset>;
  rollOptions: RollOptionGroup;
  gameAssets: Record<string, IAsset>;
  gameConditionMeters: Record<string, number>;
}

// One character's rolls for a move: what its assets add, its legacy tracks
// and its action rolls.
export function CharacterRollOptions(props: CharacterRollOptionsProps) {
  const {
    move,
    showName,
    characterId,
    characterData,
    characterAssets,
    rollOptions,
    gameAssets,
    gameConditionMeters,
  } = props;
  const nameId = useId();

  return (
    <Stack
      gap="2"
      role={showName ? "group" : undefined}
      aria-labelledby={showName ? nameId : undefined}
    >
      {showName && (
        <Text id={nameId} variant="eyebrow" color="muted" as="p">
          {characterData.name}
        </Text>
      )}
      <AssetEnhancements enhancements={rollOptions.assetEnhancements} />
      {rollOptions.specialTracks && (
        <SpecialTracks
          moveId={move._id}
          moveName={move.name}
          tracks={rollOptions.specialTracks}
          characterData={characterData}
        />
      )}
      {rollOptions.actionRolls.length > 0 && (
        <ActionRolls
          moveId={move._id}
          moveName={move.name}
          actionRolls={rollOptions.actionRolls}
          character={{
            id: characterId,
            data: characterData,
            assets: characterAssets,
          }}
          gameAssets={gameAssets}
          gameConditionMeters={gameConditionMeters}
        />
      )}
    </Stack>
  );
}
