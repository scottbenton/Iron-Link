/**
 * The game page on a character, laid out as the live app lays it out and
 * reskinned with the library. Live component to library component:
 *
 * - `BaseLayout` + `NavRail` / `NavRailItem` → `AppShell` + `NavRail`
 *   (80px, the current item's pill in a turning `GradientBox` border).
 * - `GameNavBar` (`NavBar`: phone only; its title is the page's h1, kept for
 *   screen readers on wide screens) → `NavBar` with `title`, `backHref` and
 *   `actions`.
 * - `WorldsBetaBanner` (MUI `Alert`, no radius) → `Alert` in GameLayout's
 *   `banner`, edge to edge.
 * - `GameTabs` (Overview, each character, Add Character; wide screens only)
 *   → `PageTabs` / `PageTab` in GameLayout's `tabs`.
 * - `SidebarLayout` → `GameLayout`: 1200px and up, three columns (sheet
 *   350px, notes, reference 350px); 900 to 1200px, the sheet over the
 *   reference in one column beside the notes (`stackSidebars`); phones,
 *   Character, Notes and Reference tabs (`compact`).
 * - `CharacterSidebarContents` → the start sidebar's panel: h2 "Character"
 *   with `CharacterSettingsMenu` (an `IconButton`), then `StyledTabs`
 *   Overview / Assets / Tracks → `SectionTabList`.
 *   - `CharacterDetails` (`PortraitAvatar`, name, `InitiativeStatusChip`)
 *     → `CharacterPortrait`, `Text`, `InitiativeChip`.
 *   - `Stats` → `StatGrid`; `ConditionMeters` → `ConditionMeter` and
 *     `MomentumMeter`; `ImpactsSection` → `ImpactsChecklist`;
 *     `LegacyTracks` → `ProgressTrack legacy`; `ExperienceSection` →
 *     `XPMeter`; their h3s → `SectionHeading`.
 *   - `AssetsSection` → `AssetCard`s under "Show all abilities" (`Checkbox`)
 *     and Add Assets (`Button`).
 *   - `TracksSection` → `ProgressTrack`s and a `Clock` under Show Completed
 *     and Add Track; `CharacterConnections` → a Connections `ProgressTrack`.
 * - `NotesSection` (h2 for screen readers, `NoteTabs`, note toolbar) → the
 *   main column with `hideTitle`, `NoteTabs` / `NoteTabPanel`,
 *   `ActionToolbar` with `Breadcrumbs`.
 * - `ReferenceSidebarContents` → the end sidebar's panel: h2 "Reference",
 *   then Moves / Oracles / Game Log (`SectionTabList`): `MoveTree` →
 *   `MoveListItem`s by category, `OracleTree` → `OracleListItem`s,
 *   `GameLog` → `GameLog`.
 */
import { DotsThreeIcon, GearSixIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";

import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { AppShell } from "../AppShell";
import { GameLayout } from "../GameLayout";
import { NavBar } from "../NavBar";
import { NavRail } from "../NavRail";
import { LayoutPanel } from "../shared/layoutPanel";
import {
  CharacterColumn,
  CharacterColumnActions,
  NotesColumn,
  ReferenceColumn,
} from "./GamePageColumns";
import { GamePageTabs, PhoneFrame } from "./StoryPlaceholders";
import { getNavItems } from "./storyData";

const meta: Meta = {
  title: "Layout/Examples/Game page",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

/** On a character's page the title is the character's name, as live. */
const pageTitle = "Kira Vale";

function useGameColumns() {
  const character: LayoutPanel = {
    id: "character",
    title: "Character",
    actions: <CharacterColumnActions />,
    content: <CharacterColumn />,
  };
  const notes: LayoutPanel & { hideTitle: boolean } = {
    id: "notes",
    title: "Notes",
    hideTitle: true,
    content: <NotesColumn />,
  };
  const reference: LayoutPanel = {
    id: "reference",
    title: "Reference",
    content: <ReferenceColumn />,
  };
  return { character, notes, reference };
}

function WorldsBetaBanner() {
  return (
    <Alert
      tone="info"
      title="This game has a world"
      action={
        <Button size="sm" variant="ghost">
          Turn on the beta
        </Button>
      }
      onClose={() => {}}
      closeLabel="Dismiss"
    >
      Turn on the Worlds beta to see it in your notes. You can turn it off again
      in Advanced Features.
    </Alert>
  );
}

function WideGamePage(props: { stacked?: boolean; banner?: boolean }) {
  const { character, notes, reference } = useGameColumns();
  // The app keeps these and remembers them per device.
  const [sheetWidth, setSheetWidth] = useState(350);
  const [referenceWidth, setReferenceWidth] = useState(350);
  return (
    <AppShell
      fill
      rail={
        <NavRail
          items={getNavItems("games")}
          homeHref="#games"
          actions={
            <IconButton label="App Settings" tooltipSide="right">
              <GearSixIcon />
            </IconButton>
          }
        />
      }
      topBar={<NavBar title={pageTitle} backHref="#overview" />}
    >
      <GameLayout
        banner={props.banner ? <WorldsBetaBanner /> : undefined}
        tabs={<GamePageTabs current="kira" />}
        main={notes}
        stackSidebars={props.stacked}
        startSidebar={{
          panels: [character],
          width: sheetWidth,
          onWidthChange: setSheetWidth,
        }}
        endSidebar={{
          panels: [reference],
          width: referenceWidth,
          onWidthChange: setReferenceWidth,
        }}
      />
    </AppShell>
  );
}

/**
 * 1200px and up: the character sheet, the notes and the reference side by
 * side, under the game's tabs. Both sidebars resize and collapse.
 */
export const Desktop: Story = {
  render: () => <WideGamePage />,
};

/** With the Worlds beta banner over the tabs, edge to edge. */
export const DesktopWithBanner: Story = {
  name: "Desktop, with banner",
  render: () => <WideGamePage banner />,
};

const mediumFrame = css({
  width: "1100px",
  maxWidth: "100%",
  height: "760px",
  marginInline: "auto",
  border: "1px solid token(colors.border.default)",
  overflow: "hidden",
  "--app-shell-height": "100%",
});

/**
 * 900 to 1200px (shown at 1100px): the sheet over the reference in one
 * column, the notes beside them, as the live app does at this width.
 */
export const Medium: Story = {
  name: "Medium (1100px)",
  parameters: { layout: "padded" },
  render: () => (
    <div className={mediumFrame}>
      <WideGamePage stacked />
    </div>
  ),
};

function PhoneGamePage() {
  const { character, notes, reference } = useGameColumns();
  return (
    <PhoneFrame>
      <AppShell
        fill
        topBar={
          <NavBar
            title={pageTitle}
            backHref="#overview"
            actions={
              <IconButton label="Game and Character Settings">
                <DotsThreeIcon weight="bold" />
              </IconButton>
            }
          />
        }
      >
        {/* The live app hides the game's page tabs on phones. */}
        <GameLayout
          compact
          main={notes}
          startSidebar={{ panels: [character] }}
          endSidebar={{ panels: [reference] }}
        />
      </AppShell>
    </PhoneFrame>
  );
}

/**
 * A phone: Character, Notes and Reference tabs under the bar (back to the
 * game, the character's name, its menu), opening on Character as live.
 */
export const Phone: Story = {
  parameters: { layout: "padded" },
  render: () => <PhoneGamePage />,
};
