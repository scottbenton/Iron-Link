import { Datasworn } from "@datasworn-community/core";
import { Box, Checkbox, Stack, Typography } from "@mui/material";

import { MarkdownRenderer } from "components/MarkdownRenderer";

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
          />
          <Box key={ability.index}>
            {ability.name && (
              <Typography display={"inline"} variant={"body2"}>
                <b>{ability.name}: </b>
              </Typography>
            )}
            <MarkdownRenderer markdown={ability.text} inlineParagraph />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
