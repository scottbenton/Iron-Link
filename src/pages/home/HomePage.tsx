import { PageContent } from "ui/layout";
import { Stack } from "ui/primitives";

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
    <PageContent>
      <Stack gap="16" paddingBlockStart="12">
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
      </Stack>
    </PageContent>
  );
}
