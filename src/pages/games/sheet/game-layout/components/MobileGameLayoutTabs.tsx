import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import { Tabs } from "@chakra-ui/react";

import { GameLayoutTabs } from "../gameLayoutTabs.enum";

export interface MobileGameLayoutTabsProps {
  tab: GameLayoutTabs;
  setTab: (tab: GameLayoutTabs) => void;
}
export function MobileGameLayoutTabs(props: MobileGameLayoutTabsProps) {
  const { tab, setTab } = props;

  const t = useGameTranslations();
  const characterId = useCharacterIdOptional();

  return (
    <Tabs.Root
      lazyMount
      value={tab}
      onValueChange={({ value }) => {
        setTab(value as GameLayoutTabs);
      }}
      overflow="auto"
      variant="line"
      fitted
    >
      <Tabs.List borderBottomColor="transparent" _before={{ display: "none" }}>
        <Tabs.Trigger
          value={GameLayoutTabs.Outlet}
          aria-controls="tabpanel-outlet"
          flexShrink={0}
        >
          {characterId
            ? t("game-layout-tabs-character", "Character")
            : t("game-layout-tabs-game", "Game")}
        </Tabs.Trigger>
        <Tabs.Trigger
          value={GameLayoutTabs.Notes}
          aria-controls="tabpanel-notes"
          flexShrink={0}
        >
          {t("game-layout-tabs-notes", "Notes")}
        </Tabs.Trigger>
        <Tabs.Trigger
          value={GameLayoutTabs.Reference}
          aria-controls="tabpanel-reference"
          flexShrink={0}
        >
          {t("game-layout-tabs-reference", "Reference")}
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  );
}
