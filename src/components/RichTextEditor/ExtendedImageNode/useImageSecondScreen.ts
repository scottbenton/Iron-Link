import { useCallback } from "react";

import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import { useSecondScreenStore } from "stores/secondScreen.store";

import { isGuideImageSrc } from "../secrets/guideImages";

/**
 * Whether a note image can go to the game's second screen, whether it is
 * there now, and a toggle. An image inside a secret never can, since
 * players watch the second screen.
 */
export function useImageSecondScreen(src: string, label: string) {
  const available = useSecondScreenFeature() && !isGuideImageSrc(src);
  const updateSecondScreen = useSecondScreenStore(
    (store) => store.updateSecondScreenSettings,
  );
  const isOpen = useSecondScreenStore(
    (store) =>
      store.settings?.type === "note_image" && store.settings.url === src,
  );
  const gameId = useGameIdOptional();

  const toggle = useCallback(() => {
    if (!gameId) return;
    updateSecondScreen(
      gameId,
      isOpen ? null : { type: "note_image", url: src, label },
    );
  }, [gameId, isOpen, label, src, updateSecondScreen]);

  return { available: available && !!gameId, isOpen, toggle };
}
