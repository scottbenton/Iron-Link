import { ReactNode } from "react";

import { AppShell } from "../AppShell";
import { NavBar } from "../NavBar";
import { NavRail } from "../NavRail";
import { DemoSettingsMenu } from "../SettingsMenu/SettingsMenuDemo";
import { guideScenario } from "../SettingsMenu/settingsMenuScenarios";
import { character } from "./playLayoutsShared";
import { getNavItems } from "./storyData";

/* ------------------------------------------------------------------------ */
/* Page frame                                                               */
/* ------------------------------------------------------------------------ */

/** The app's chrome around a proposal: rail, bar (its h1), page tabs. */
export function PlayShell(props: { children: ReactNode; title?: string }) {
  return (
    <AppShell
      fill
      rail={
        <NavRail
          items={getNavItems("games")}
          homeHref="#games"
          actions={
            <DemoSettingsMenu
              rail
              scenario={guideScenario}
              side="inline-end"
              align="end"
              tooltipSide="right"
            />
          }
        />
      }
      topBar={
        <NavBar
          title={props.title ?? character.name}
          backHref="#overview"
          actions={<DemoSettingsMenu scenario={guideScenario} />}
        />
      }
    >
      {props.children}
    </AppShell>
  );
}
