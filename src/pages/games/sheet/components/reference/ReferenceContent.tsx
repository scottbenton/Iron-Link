import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { Box, Tabs } from "@chakra-ui/react";

import { GameLog } from "./GameLog";

enum ReferenceTabs {
  Moves = "moves",
  Oracles = "oracles",
  GameLog = "game-log",
}

export function ReferenceContent() {
  const t = useGameTranslations();
  return (
    <Box pb={4} pt={2}>
      <Tabs.Root defaultValue={ReferenceTabs.Moves} variant="subtle" lazyMount>
        <Tabs.List colorPalette="gray" display="flex" justifyContent={"center"}>
          <Tabs.Trigger value={ReferenceTabs.Moves}>
            {t("reference-tabs-moves", "Moves")}
          </Tabs.Trigger>

          <Tabs.Trigger value={ReferenceTabs.Oracles}>
            {t("reference-tabs-oracles", "Oracles")}
          </Tabs.Trigger>
          <Tabs.Trigger value={ReferenceTabs.GameLog}>
            {t("reference-tabs-game-log", "Game Log")}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value={ReferenceTabs.Moves}>Moves</Tabs.Content>
        <Tabs.Content value={ReferenceTabs.Oracles}>Oracles</Tabs.Content>
        <Tabs.Content value={ReferenceTabs.GameLog} px={4}>
          <GameLog />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
