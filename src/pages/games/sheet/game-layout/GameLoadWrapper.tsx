import { ProgressBar } from "@/components/common/ProgressBar";
import { EmptyState } from "@/components/layout/EmptyState";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameStore } from "@/stores/game.store";
import { useSyncSecondScreenSettingsIfActive } from "@/stores/secondScreen.store";
import { PropsWithChildren } from "react";

import { useGameKeybinds } from "./hooks/useGameKeybinds";
import { useSyncGame } from "./hooks/useSyncGame";

export function GameLoadWrapper(props: PropsWithChildren) {
  const { children } = props;

  const t = useGameTranslations();

  useGameKeybinds();
  useSyncGame();
  useSyncSecondScreenSettingsIfActive();

  const hasGame = useGameStore((store) => store.game !== null);
  const error = useGameStore((store) => store.error);

  if (!hasGame && !error) {
    return <ProgressBar />;
  }

  if (error) {
    return (
      <EmptyState message={t("game-load-error", "Failed to load game.")} />
    );
  }

  return <>{children}</>;
}
