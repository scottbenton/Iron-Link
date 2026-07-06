import { Box } from "@mui/material";

import { PageContent } from "components/Layout";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { GroupPlaySection } from "./components/GroupPlaySection";
import { HeroSection } from "./components/HeroSection";
import { LicensingFooter } from "./components/LicensingFooter";
import { RulesetsStrip } from "./components/RulesetsStrip";
import { ScreenshotShowcase } from "./components/ScreenshotShowcase";
import { SoloFeatureStrip } from "./components/SoloFeatureStrip";
import { useLandingDemo } from "./components/useLandingDemo";

export default function HomePage() {
  useSendPageViewEvent(PageCategory.Home);

  const { logEntries, trackTicks, setTrackTicks, handlePlayerRoll } =
    useLandingDemo();

  return (
    <PageContent maxWidth="lg">
      <Box display="flex" flexDirection="column" gap={8} pt={6}>
        <HeroSection onRoll={handlePlayerRoll} />
        <GroupPlaySection
          logEntries={logEntries}
          trackTicks={trackTicks}
          onTrackTicksChange={setTrackTicks}
        />
        <SoloFeatureStrip />
        <ScreenshotShowcase />
        <RulesetsStrip />
        <LicensingFooter />
      </Box>
    </PageContent>
  );
}
