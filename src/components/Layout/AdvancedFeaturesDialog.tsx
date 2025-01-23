import {
  Box,
  Dialog,
  DialogContent,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import {
  advancedFeatures,
  useAdvancedFeatureToggles,
} from "hooks/advancedFeatures/advancedFeatures";

export interface AdvancedFeaturesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AdvancedFeaturesDialog(props: AdvancedFeaturesDialogProps) {
  const { open, onClose } = props;

  const { t } = useTranslation();

  const featureStates = useAdvancedFeatureToggles((state) => state.toggles);
  const updateFeature = useAdvancedFeatureToggles(
    (state) => state.updateToggle,
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("advanced-features.title", "Advanced Features")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Stack direction={"column"} spacing={2}>
          {Object.entries(advancedFeatures).map(
            ([key, { name, description }]) => (
              <Box key={key}>
                <FormControlLabel
                  label={name}
                  control={
                    <Switch
                      checked={
                        featureStates[key as keyof typeof advancedFeatures]
                      }
                      onChange={(event) =>
                        updateFeature(
                          key as keyof typeof advancedFeatures,
                          event.target.checked,
                        )
                      }
                    />
                  }
                />
                <Typography color="textSecondary" variant={"body2"} ml={6}>
                  {description}
                </Typography>
              </Box>
            ),
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
