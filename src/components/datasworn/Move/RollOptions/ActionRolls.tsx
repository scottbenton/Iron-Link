import { Datasworn } from "@datasworn-community/core";
import { Box, SxProps, Theme } from "@mui/material";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { ConditionMeter } from "components/datasworn/ConditonMeter";

import { useGameCharactersStore } from "stores/gameCharacters.store";

import { IAsset } from "services/asset.service";

import { MoveActionRollButton } from "./MoveActionRollButton";
import { MoveActionRollChip } from "./MoveActionRollChip";
import { CharacterRollOptionState } from "./common.types";

export interface ActionRollsProps {
  moveId: string;
  actionRolls: Datasworn.RollableValue[];
  character?: {
    id: string;
    data: CharacterRollOptionState;
    assets: Record<string, IAsset>;
  };
  gameAssets: Record<string, IAsset>;
  gameConditionMeters: Record<string, number>;
  sx?: SxProps<Theme>;
  includeAdds?: boolean;
}

export function ActionRolls(props: ActionRollsProps) {
  const {
    moveId,
    actionRolls,
    character,
    gameAssets,
    gameConditionMeters,
    sx,
    includeAdds,
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
    <Box display="flex" flexWrap="wrap" gap={1} sx={sx}>
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
        <ConditionMeter
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
