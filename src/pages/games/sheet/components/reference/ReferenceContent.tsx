import { MoveList } from "@/components/datasworn/MoveList/MoveList";
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
    <Box display="flex" maxH="100%">
      <Tabs.Root
        defaultValue={ReferenceTabs.Moves}
        variant="subtle"
        lazyMount
        display="flex"
        flexDirection={"column"}
        flexGrow={1}
        pt={2}
      >
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
        <Tabs.Content
          mt={-2}
          value={ReferenceTabs.Moves}
          flexGrow={1}
          overflow={"auto"}
        >
          <MoveList />
        </Tabs.Content>
        <Tabs.Content
          value={ReferenceTabs.Oracles}
          flexGrow={1}
          overflow={"auto"}
        >
          Oracles
        </Tabs.Content>
        <Tabs.Content
          value={ReferenceTabs.GameLog}
          px={4}
          pb={4}
          flexGrow={1}
          overflow={"auto"}
          display="flex"
          flexDirection="column-reverse"
        >
          <GameLog />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
