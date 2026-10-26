import CloseIcon from "@mui/icons-material/Close";
import { Alert, AlertTitle, Box, Button, IconButton } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAdvancedFeatureToggles } from "hooks/advancedFeatures/advancedFeatures";
import { useWorldsBetaBannerDismissals } from "hooks/advancedFeatures/worldsBetaBanner";

export interface WorldsBetaBannerProps {
  gameId: string;
}

// A banner above the game's tabs when the game has a world the viewer cannot
// see. Turning the beta on reveals the world in Notes; dismissing it hides the
// banner for this game on this device.
export function WorldsBetaBanner(props: WorldsBetaBannerProps) {
  const { gameId } = props;
  const { t } = useTranslation();

  const updateToggle = useAdvancedFeatureToggles((state) => state.updateToggle);
  const dismiss = useWorldsBetaBannerDismissals((state) => state.dismiss);

  return (
    <Alert
      severity="info"
      sx={{ borderRadius: 0, alignItems: "center" }}
      // An Alert's action replaces its onClose button, so both live here.
      action={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Button
            color="inherit"
            size="small"
            onClick={() => updateToggle("worlds", true)}
          >
            {t("worlds.beta-banner.turn-on", "Turn on the beta")}
          </Button>
          <IconButton
            color="inherit"
            size="small"
            aria-label={t("worlds.beta-banner.dismiss", "Dismiss")}
            onClick={() => dismiss(gameId)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      <AlertTitle>
        {t("worlds.beta-banner.title", "This game has a world")}
      </AlertTitle>
      {t(
        "worlds.beta-banner.description",
        "Turn on the Worlds beta to see it in your notes. You can turn it off again in Advanced Features.",
      )}
    </Alert>
  );
}
