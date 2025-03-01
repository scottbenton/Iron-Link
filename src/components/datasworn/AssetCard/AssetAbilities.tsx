import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { Checkbox } from "@/components/ui/checkbox";
import { IAsset } from "@/services/asset.service";
import { Box, Stack, Text } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";

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
    <Stack gap={3} flexGrow={1} ml={-1} mt={2}>
      {filteredAbilities.map((ability) => (
        <Box display={"flex"} alignItems={"flex-start"} key={ability.index}>
          <Checkbox
            checked={
              (ability.enabled ||
                assetDocument?.enabledAbilities[ability.index]) ??
              false
            }
            disabled={ability.enabled || !onAbilityToggle}
            onCheckedChange={(evt) =>
              onAbilityToggle &&
              onAbilityToggle(ability.index, evt.checked === true)
            }
            mt={1}
          />
          <Box ml={2} key={ability.index}>
            {ability.name && (
              <Text display={"inline"} fontSize="sm">
                <b>{ability.name}: </b>
              </Text>
            )}
            <MarkdownRenderer markdown={ability.text} inlineParagraph />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
