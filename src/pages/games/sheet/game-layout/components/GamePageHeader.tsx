import { PageHeader } from "@/components/layout/PageHeader";
import { Box } from "@chakra-ui/react";

import { GameLayoutTabs } from "../gameLayoutTabs.enum";
import { CharacterTabs } from "./CharacterTabs";
import { MobileGameLayoutTabs } from "./MobileGameLayoutTabs";

export interface GamePageHeaderProps {
  tab: GameLayoutTabs;
  setTab: (tab: GameLayoutTabs) => void;
}

export function GamePageHeader(props: GamePageHeaderProps) {
  const { tab, setTab } = props;

  return (
    <PageHeader
      overline={
        <>
          <Box display={{ base: "none", md: "block" }}>
            <CharacterTabs />
          </Box>
          <Box display={{ base: "block", md: "none" }}>
            <MobileGameLayoutTabs tab={tab} setTab={setTab} />
          </Box>
        </>
      }
      mb={{ base: -4, md: -4 }}
      mt={{ base: -3, md: 0 }}
    />
  );
}
