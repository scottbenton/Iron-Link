import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { Box, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { AssetEnhancements as IAssetEnhancements } from "./extractRollOptions";

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
    <Box display="flex" flexDirection="column" gap={2}>
      {Object.values(enhancements).map(
        ({ assetName, assetInputName, assetAbilityText }, index) => (
          <Box key={index} p={1} bg="bg.muted" borderRadius={1}>
            <Text textTransform="uppercase" fontFamily="heading">
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
            <MarkdownRenderer
              disableLinks
              fontSize="sm"
              markdown={assetAbilityText}
            />
          </Box>
        ),
      )}
    </Box>
  );
}
