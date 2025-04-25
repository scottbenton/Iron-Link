import { Dialog } from "@/components/common/Dialog";
import { Switch } from "@/components/ui/switch";
import {
  advancedFeatures,
  useAdvancedFeatureToggles,
} from "@/hooks/advancedFeatures/advancedFeatures";
import { useLayoutTranslations } from "@/hooks/i18n/useLayoutTranslations";
import { Box, Stack, Text } from "@chakra-ui/react";

export interface AdvancedFeaturesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AdvancedFeaturesDialog(props: AdvancedFeaturesDialogProps) {
  const { open, onClose } = props;

  const t = useLayoutTranslations();

  const featureStates = useAdvancedFeatureToggles((state) => state.toggles);
  const updateFeature = useAdvancedFeatureToggles(
    (state) => state.updateToggle,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("advanced-features.title", "Advanced Features")}
      content={
        <Stack dir="column" gap={4}>
          {Object.entries(advancedFeatures).map(
            ([key, { name, description }]) => (
              <Box key={key}>
                <Switch
                  checked={featureStates[key as keyof typeof advancedFeatures]}
                  onCheckedChange={({ checked }) =>
                    updateFeature(key as keyof typeof advancedFeatures, checked)
                  }
                >
                  {name}
                </Switch>

                <Text color="fg.muted" fontSize="sm" ml={12} pl={1}>
                  {description}
                </Text>
              </Box>
            ),
          )}
        </Stack>
      }
    />
  );
}
