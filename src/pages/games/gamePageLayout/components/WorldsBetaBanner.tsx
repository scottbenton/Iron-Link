import { useTranslation } from "react-i18next";

import { Alert } from "ui/components/Alert";
import { Button } from "ui/components/Button";

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
      tone="info"
      title={t("worlds.beta-banner.title", "This game has a world")}
      action={
        <Button
          size="sm"
          variant="ghost"
          onClick={() => updateToggle("worlds", true)}
        >
          {t("worlds.beta-banner.turn-on", "Turn on the beta")}
        </Button>
      }
      onClose={() => dismiss(gameId)}
      closeLabel={t("worlds.beta-banner.dismiss", "Dismiss")}
    >
      {t(
        "worlds.beta-banner.description",
        "Turn on the Worlds beta to see it in your notes. You can turn it off again in Advanced Features.",
      )}
    </Alert>
  );
}
