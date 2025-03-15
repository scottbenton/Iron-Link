import { Box, Button } from "@chakra-ui/react";
import { useState } from "react";

import { CharacterOrOverviewContent } from "../components/character/CharacterOrOverviewContent";
import { HandleSoloGameRedirect } from "./HandleSoloGameRedirect";
import { GamePageContentWithId } from "./components/GamePageContentWithId";
import { GamePageHeader } from "./components/GamePageHeader";
import { MobileOnlyTabPanel } from "./components/MobileOnlyTabPanel";
import { SyncColorScheme } from "./components/SyncColorScheme";
import { GameLayoutTabs } from "./gameLayoutTabs.enum";

export function GameLayout() {
  const [tab, setTab] = useState(GameLayoutTabs.Outlet);

  const [count, setCount] = useState(0);

  return (
    <>
      <HandleSoloGameRedirect />
      <SyncColorScheme />
      <GamePageHeader />
      <GamePageContentWithId>
        <Box
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            md: "350px 1fr",
            xl: "350px 1fr 350px",
          }}
          gridTemplateRows={{
            base: "1fr",
            md: "1fr 1fr",
            xl: "1fr",
          }}
          mx={-4}
          gap={3}
          maxH={{ base: undefined, md: "100lvh" }}
          py={{ base: 0, md: 3 }}
          minH="100lvh"
        >
          <MobileOnlyTabPanel
            gridRow={1}
            gridColumn={1}
            tab={GameLayoutTabs.Outlet}
            currentOpenTab={tab}
            cardBodyProps={{ p: 0 }}
          >
            <CharacterOrOverviewContent />
          </MobileOnlyTabPanel>
          <MobileOnlyTabPanel
            gridRow={{ base: 1, md: 2, xl: 1 }}
            gridColumn={{ base: 1, xl: 3 }}
            tab={GameLayoutTabs.Reference}
            currentOpenTab={tab}
          >
            Reference Sidebar
          </MobileOnlyTabPanel>
          <MobileOnlyTabPanel
            gridRow={{ base: 1, md: "1 / span 2", xl: 1 }}
            gridColumn={{ base: 1, md: 2 }}
            tab={GameLayoutTabs.Notes}
            currentOpenTab={tab}
          >
            Notes
            {count}
            <Button onClick={() => setCount(count + 1)}>Increment</Button>
          </MobileOnlyTabPanel>
        </Box>
      </GamePageContentWithId>
    </>
  );
}
