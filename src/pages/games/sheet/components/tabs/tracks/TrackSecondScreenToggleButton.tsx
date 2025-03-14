import { useSecondScreenFeature } from "@/hooks/advancedFeatures/useSecondScreenFeature";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameId } from "@/hooks/useGameId";
import { useSecondScreenStore } from "@/stores/secondScreen.store";
import { Button } from "@chakra-ui/react";
import { useCallback } from "react";

interface TrackSecondScreenToggleButtonProps {
  trackId: string;
}

export function TrackSecondScreenToggleButton(
  props: TrackSecondScreenToggleButtonProps,
) {
  const { trackId } = props;

  const t = useGameTranslations();
  const gameId = useGameId();

  const areSecondScreenSettingsActive = useSecondScreenFeature();
  const isTrackOpenOnSecondScreen = useSecondScreenStore(
    (store) =>
      store.settings?.type === "track" && store.settings.trackId === trackId,
  );

  const openOnSecondScreen = useSecondScreenStore(
    (store) => store.updateSecondScreenSettings,
  );
  const handleTrackSecondScreenToggle = useCallback(() => {
    openOnSecondScreen(
      gameId,
      isTrackOpenOnSecondScreen
        ? null
        : {
            type: "track",
            trackId,
          },
    ).catch(() => {});
  }, [trackId, gameId, openOnSecondScreen, isTrackOpenOnSecondScreen]);

  if (!areSecondScreenSettingsActive) {
    return null;
  }

  return (
    <Button
      variant={isTrackOpenOnSecondScreen ? "subtle" : "ghost"}
      onClick={handleTrackSecondScreenToggle}
    >
      {isTrackOpenOnSecondScreen
        ? t("track-second-screen-button-on-screen", "Remove from Guide Screen")
        : t(
            "track-second-screen-button-send-to-screen",
            "Display on Guide Screen",
          )}
    </Button>
  );
}
