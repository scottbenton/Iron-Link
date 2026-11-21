import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { RulesText } from "ui/game/RulesText";

import { AssetEnhancements as IAssetEnhancements } from "./RollOptions/extractRollOptions";

export interface AssetEnhancementsProps {
  enhancements: IAssetEnhancements;
}

export function AssetEnhancements(props: AssetEnhancementsProps) {
  const { enhancements } = props;

  const { t } = useTranslation();

  if (Object.keys(enhancements).length === 0) {
    return null;
  }

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {Object.values(enhancements).map(
        ({ assetName, assetInputName, assetAbilityText }, index) => (
          <Box key={index} p={1} bgcolor="background.default" borderRadius={1}>
            <Typography textTransform="uppercase" fontFamily="fontFamilyTitle">
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
            </Typography>
            <RulesText markdown={assetAbilityText} size="sm" disableLinks />
          </Box>
        ),
      )}
    </Box>
  );
}
