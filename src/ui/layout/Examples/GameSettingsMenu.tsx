import { useState } from "react";

import { DemoSettingsMenu } from "../SettingsMenu/DemoSettingsMenu";
import { guideScenario } from "../SettingsMenu/settingsMenuScenarios";
import { SecondScreenDialog } from "./SecondScreenDialog";

/**
 * The gear menu: the combined SettingsMenu (Kira's settings, the game's with
 * Second Screen, Change Theme, the app's), as on the wide page's rail.
 * Phones have no Reference tab, so Second Screen opens its dialog here.
 */
export function GameSettingsMenu(props: { overview?: boolean }) {
  const [secondScreenOpen, setSecondScreenOpen] = useState(false);
  return (
    <>
      <DemoSettingsMenu
        scenario={
          // On the overview no character is open: the game's and app's.
          props.overview
            ? { ...guideScenario, character: undefined }
            : guideScenario
        }
        onSelect={(action) => {
          if (action === "secondScreen") setSecondScreenOpen(true);
        }}
      />
      <SecondScreenDialog
        open={secondScreenOpen}
        onClose={() => setSecondScreenOpen(false)}
      />
    </>
  );
}
