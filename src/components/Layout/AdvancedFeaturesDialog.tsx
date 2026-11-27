import { useTranslation } from "react-i18next";

import { Checkbox } from "ui/components/Checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDoneButton,
  DialogHeader,
} from "ui/components/Dialog";
import { Stack } from "ui/primitives";

import {
  advancedFeatures,
  useAdvancedFeatureToggles,
} from "hooks/advancedFeatures/advancedFeatures";

export interface AdvancedFeaturesDialogProps {
  open: boolean;
  onClose: () => void;
}

type AdvancedFeatureKey = keyof typeof advancedFeatures;

export function AdvancedFeaturesDialog(props: AdvancedFeaturesDialogProps) {
  const { open, onClose } = props;

  const { t } = useTranslation();

  const featureStates = useAdvancedFeatureToggles((state) => state.toggles);
  const updateFeature = useAdvancedFeatureToggles(
    (state) => state.updateToggle,
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title={t("advanced-features.title", "Advanced Features")} />
      <DialogBody>
        <Stack gap="4">
          {(
            Object.entries(advancedFeatures) as [
              AdvancedFeatureKey,
              (typeof advancedFeatures)[AdvancedFeatureKey],
            ][]
          ).map(([key, { name, description }]) => (
            <Checkbox
              key={key}
              label={name}
              description={description}
              checked={featureStates[key] ?? false}
              onCheckedChange={(checked) => updateFeature(key, checked)}
            />
          ))}
        </Stack>
      </DialogBody>
      <DialogActions>
        <DialogDoneButton />
      </DialogActions>
    </Dialog>
  );
}
