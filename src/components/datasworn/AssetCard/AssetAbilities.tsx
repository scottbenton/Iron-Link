import { Datasworn } from "@datasworn-community/core";
import { Box, Checkbox, Stack } from "@mui/material";
import { useId } from "react";

import { RulesText } from "ui/game/RulesText";

import { IAsset } from "services/asset.service";

export interface AssetAbilitiesProps {
  abilities: Datasworn.AssetAbility[];
  assetDocument?: IAsset;
  onAbilityToggle?: (abilityIndex: number, checked: boolean) => void;
  hideUnavailableAbilities?: boolean;
}

export function AssetAbilities(props: AssetAbilitiesProps) {
  const {
    abilities,
    assetDocument,
    onAbilityToggle,
    hideUnavailableAbilities,
  } = props;

  const idPrefix = useId();

  const abilitiesWithIndex = abilities.map((ability, index) => ({
    ...ability,
    index,
  }));

  const filteredAbilities = hideUnavailableAbilities
    ? abilitiesWithIndex.filter(
        (ability) =>
          (ability.enabled || assetDocument?.enabledAbilities[ability.index]) ??
          false,
      )
    : abilitiesWithIndex;

  return (
    <Stack spacing={1} flexGrow={1} sx={{ ml: -1, flexGrow: 1 }}>
      {filteredAbilities.map((ability) => (
        <Box display={"flex"} alignItems={"flex-start"} key={ability.index}>
          <Checkbox
            checked={
              (ability.enabled ||
                assetDocument?.enabledAbilities[ability.index]) ??
              false
            }
            disabled={ability.enabled || !onAbilityToggle}
            onChange={(evt) =>
              onAbilityToggle &&
              onAbilityToggle(ability.index, evt.target.checked)
            }
            sx={{ p: 0.5 }}
            slotProps={{
              input: {
                // Named by the ability's own text beside it.
                "aria-labelledby": `${idPrefix}-ability-${ability.index}`,
              },
            }}
          />
          <Box key={ability.index} id={`${idPrefix}-ability-${ability.index}`}>
            {/* The name leads the text in bold, as on the library's asset card. */}
            <RulesText
              markdown={
                ability.name
                  ? `__${ability.name}:__ ${ability.text}`
                  : ability.text
              }
              size="sm"
              color="muted"
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
