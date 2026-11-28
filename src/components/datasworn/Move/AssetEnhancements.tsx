import { useTranslation } from "react-i18next";

import { Text } from "ui/components/Text";
import { RulesText } from "ui/game/RulesText";
import { Box, Stack } from "ui/primitives";

import { AssetEnhancements as IAssetEnhancements } from "./RollOptions/extractRollOptions";

export interface AssetEnhancementsProps {
  enhancements: IAssetEnhancements;
}

// The asset abilities that change how a move rolls, read beside its rolls.
export function AssetEnhancements(props: AssetEnhancementsProps) {
  const { enhancements } = props;
  const { t } = useTranslation();

  if (Object.keys(enhancements).length === 0) {
    return null;
  }

  return (
    <Stack gap="2">
      {Object.values(enhancements).map(
        ({ assetName, assetInputName, assetAbilityText }, index) => (
          <Box key={index} padding="2" background="bg.canvas" borderRadius="md">
            <Text variant="label" as="p">
              {assetInputName
                ? t(
                    "datasworn.move.asset-enhancement-asset-input-name",
                    "{{assetName}} Asset: {{assetInputName}}",
                    { assetName, assetInputName },
                  )
                : t(
                    "datasworn.move.asset-enhancement-asset-name",
                    "{{assetName}} Asset",
                    { assetName },
                  )}
            </Text>
            <RulesText markdown={assetAbilityText} size="sm" disableLinks />
          </Box>
        ),
      )}
    </Stack>
  );
}
