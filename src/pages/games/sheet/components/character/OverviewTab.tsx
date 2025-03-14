import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import { Tabs } from "@chakra-ui/react";

import { OverviewTabs } from "./overviewTabs.enum";

export function OverviewTab() {
  const t = useGameTranslations();
  const characterId = useCharacterIdOptional();
  return (
    <Tabs.Trigger value={OverviewTabs.Overview}>
      {characterId
        ? t("game-tabs-characters-and-users", "Characters")
        : t("game-tabs-character-overview", "Overview")}
    </Tabs.Trigger>
  );
}
