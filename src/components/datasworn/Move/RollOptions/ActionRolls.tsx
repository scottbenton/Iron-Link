import { IAsset } from "@/services/asset.service";
import { useGameCharactersStore } from "@/stores/gameCharacters.store";
import { Box, BoxProps } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DebouncedConditionMeter } from "../../ConditonMeter";
import { MoveActionRollButton } from "./MoveActionRollButton";
import { MoveActionRollChip } from "./MoveActionRollChip";
import { CharacterRollOptionState } from "./common.types";

export interface ActionRollsProps extends Omit<BoxProps, "children"> {
  moveId: string;
  actionRolls: Datasworn.RollableValue[];
  character?: {
    id: string;
    data: CharacterRollOptionState;
    assets: Record<string, IAsset>;
  };
  gameAssets: Record<string, IAsset>;
  gameConditionMeters: Record<string, number>;
  includeAdds?: boolean;
}

export function ActionRolls(props: ActionRollsProps) {
  const {
    moveId,
    actionRolls,
    character,
    gameAssets,
    gameConditionMeters,
    includeAdds,
    ...boxProps
  } = props;
  const { t } = useTranslation();
  const characterId = character?.id;

  const updateAdds = useGameCharactersStore(
    (store) => store.updateCharacterAdds,
  );
  const handleAddsChange = useCallback(
    (newAdds: number) => {
      if (characterId) {
        updateAdds(characterId, newAdds).catch(() => {});
      }
    },
    [characterId, updateAdds],
  );
  return (
    <Box display="flex" flexWrap="wrap" gap={1} {...boxProps}>
      {actionRolls.map((roll, index) => (
        <React.Fragment key={index}>
          {character ? (
            <MoveActionRollButton
              rollOption={roll}
              key={index}
              characterId={character.id}
              characterData={character.data}
              characterAssets={character.assets}
              gameAssets={gameAssets}
              gameConditionMeters={gameConditionMeters}
              moveId={moveId}
            />
          ) : (
            <MoveActionRollChip key={index} rollOption={roll} />
          )}
        </React.Fragment>
      ))}
      {character && includeAdds && (
        <DebouncedConditionMeter
          label={t("character.character-sidebar.adds", "Adds")}
          min={-9}
          max={9}
          defaultValue={0}
          value={character.data.adds}
          onChange={handleAddsChange}
        />
      )}
    </Box>
  );
}
