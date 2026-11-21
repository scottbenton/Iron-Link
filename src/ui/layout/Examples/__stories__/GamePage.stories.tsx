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
 *   reference in one column beside the notes (`stackSidebars`); 600 to
 *   900px, both on one rail before the notes, opening as flyouts that
 *   can't be pinned. Phones, below 600px, get their own page
 *   (Examples/Phone game page).
 * - `CharacterSidebarContents` → the start sidebar's panel: h2 "Character"
 *   with `CharacterSettingsMenu` (the library's `CharacterSettingsMenu`: only
 *   that character's actions), then `StyledTabs`
 *   Overview / Assets / Tracks → `SectionTabList`.
 *   - `CharacterDetails` (`PortraitAvatar`, name, `InitiativeStatusChip`)
 *     → `CharacterPortrait`, `Text`, `InitiativeChip`.
 *   - `Stats` → `StatGrid` (its Adds meter → `AddsControl`, above the
 *     stats); `ConditionMeters` → `ConditionMeter` and
 *     `MomentumMeter`; `ImpactsSection` → `ImpactsChecklist`;
 *     `LegacyTracks` → `ProgressTrack legacy`; `ExperienceSection` →
 *     `XPMeter`; their h3s → `SectionHeading`.
 *   - `AssetsSection` → `AssetCard`s under "Show all abilities" (`Checkbox`)
 *     and Add Assets (`Button`).
 *   - `TracksSection`, `CharacterConnections` and `CharacterWorldBonds` →
 *     `TracksPanel` (its own story: Game/TracksPanel, "Tracks tab,
 *     everything"); `EditOrCreateTrackDialog` and `EditOrCreateClockDialog`
 *     → `TrackDialog`.
 * - `GameOverviewSheet` (the Overview page's start column: h2 "Game
 *   Overview", then Characters / Assets / Tracks) → the start sidebar's
 *   panel with `SectionTabList`; `CharactersAndUsersTab` → `CharacterCard`s
 *   (Open on Screen), Add Character, then `UserCard`s → `PlayerCard`s and
 *   `GameInviteButton` → Copy Invite Link. Its `GameSettingsMenu` is the
 *   rail's combined menu.
 * - `NotesSection` (h2 for screen readers, `NoteTabs`, note toolbar) → the
 *   main column with `hideTitle`, `NoteTabs` / `NoteTabPanel`,
 *   `ActionToolbar` with `Breadcrumbs`.
 * - `ReferenceSidebarContents` → the end sidebar's panel: h2 "Reference",
 *   then Moves / Oracles / Game Log (`SectionTabList`): `MoveTree` →
 *   `MoveListItem`s by category, `OracleTree` → `OracleListItem`s,
 *   `GameLog` → `GameLog`.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";

import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { AppShell } from "../../AppShell";
import { GameLayout } from "../../GameLayout";
import { NavBar } from "../../NavBar";
import { NavRail } from "../../NavRail";
import { DemoSettingsMenu } from "../../SettingsMenu/DemoSettingsMenu";
import {
  SettingsScenario,
  guideScenario,
} from "../../SettingsMenu/settingsMenuScenarios";
import { LayoutPanel } from "../../shared/layoutPanel";
import { CharacterColumn } from "../CharacterColumn";
import { CharacterColumnActions } from "../CharacterColumnActions";
import { GamePageTabs } from "../GamePageTabs";
import { NotesColumn } from "../NotesColumn";
import { OverviewColumn } from "../OverviewColumn";
import { PhoneGamePage } from "../PhoneGamePage";
import { ReferenceColumn } from "../ReferenceColumn";
import {
  characterSections,
  overviewSections,
  referenceSections,
} from "../columnSections";
import { responsiveViewports } from "../responsiveViewports";
import { getNavItems } from "../storyData";
import { useGamePageTier } from "../useGamePageTier";

const meta: Meta = {
  title: "Examples/Game page",
  parameters: {
    layout: "fullscreen",
    viewport: { options: responsiveViewports },
  },
};

export default meta;
type Story = StoryObj;

/** Which of the game's pages is open: a character's, or the Overview. */
type GamePageKind = "character" | "overview";

/**
 * On a character's page the title is the character's name; on the
 * Overview, the game's, as live.
 */
const pageTitles: Record<GamePageKind, string> = {
  character: "Kira Vale",
  overview: "The Drowned Archive",
};

/** The Overview has no character open, so the menu is the game's and app's. */
const overviewScenario: SettingsScenario = {
  ...guideScenario,
  character: undefined,
  currentCharacterId: undefined,
};

const scenarios: Record<GamePageKind, SettingsScenario> = {
  character: guideScenario,
  overview: overviewScenario,
};

function useGameColumns(page: GamePageKind = "character") {
  // The columns' tabs are kept here so a collapsed sidebar's rail can open
  // the column on one of them.
  const [sheetSection, setSheetSection] = useState(
    page === "overview" ? "characters" : "overview",
  );
  const [referenceSection, setReferenceSection] = useState("moves");
  const character: LayoutPanel =
    page === "overview"
      ? {
          id: "overview",
          title: "Game Overview",
          sections: overviewSections,
          activeSectionId: sheetSection,
          onActiveSectionChange: setSheetSection,
          content: (
            <OverviewColumn
              section={sheetSection}
              onSectionChange={setSheetSection}
            />
          ),
        }
      : {
          id: "character",
          title: "Character",
          actions: <CharacterColumnActions />,
          sections: characterSections,
          activeSectionId: sheetSection,
          onActiveSectionChange: setSheetSection,
          content: (
            <CharacterColumn
              section={sheetSection}
              onSectionChange={setSheetSection}
            />
          ),
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
    sections: referenceSections,
    activeSectionId: referenceSection,
    onActiveSectionChange: setReferenceSection,
    content: (
      <ReferenceColumn
        section={referenceSection}
        onSectionChange={setReferenceSection}
      />
    ),
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

function WideGamePage(props: {
  stacked?: boolean;
  /** Both sidebars on one rail, opening as flyouts (600 to 900px). */
  flyouts?: boolean;
  banner?: boolean;
  page?: GamePageKind;
}) {
  const { page = "character" } = props;
  const { character, notes, reference } = useGameColumns(page);
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
            // The mode toggle, then one menu for Kira (on her page), the game
            // and the app (Scott is its Guide).
            <DemoSettingsMenu
              rail
              scenario={scenarios[page]}
              side="inline-end"
              align="end"
              tooltipSide="right"
            />
          }
        />
      }
      topBar={
        <NavBar
          title={pageTitles[page]}
          backHref={page === "overview" ? "#games" : "#overview"}
        />
      }
    >
      <GameLayout
        banner={props.banner ? <WorldsBetaBanner /> : undefined}
        tabs={
          <GamePageTabs current={page === "overview" ? "overview" : "kira"} />
        }
        main={notes}
        stackSidebars={props.stacked || props.flyouts}
        startSidebar={{
          panels: [character],
          width: sheetWidth,
          pinnable: !props.flyouts,
          onWidthChange: setSheetWidth,
        }}
        endSidebar={{
          panels: [reference],
          width: referenceWidth,
          pinnable: !props.flyouts,
          onWidthChange: setReferenceWidth,
        }}
      />
    </AppShell>
  );
}

/**
 * 1200px and up: the character sheet, the notes and the reference side by
 * side, under the game's tabs. Both sidebars resize and collapse. The
 * columns' titles are screen reader headings; their settings and Collapse
 * sit at the end of each tab well, so the three wells line up.
 */
export const Desktop: Story = {
  render: () => <WideGamePage />,
};

/**
 * The game's Overview page: the Game Overview column (the game's characters
 * and players, its shared assets and tracks) in the character sheet's
 * place. Scott is the Guide, so he can make others Guide or kick them.
 */
export const DesktopOverview: Story = {
  name: "Desktop, overview",
  render: () => <WideGamePage page="overview" />,
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
 * column, the notes beside them, as the live app does at this width. Each
 * sidebar collapses on its own: collapse Reference and the sheet stays
 * pinned with Reference on a rail beside it, both still before the notes
 * (see "Game page, collapsed sidebars").
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

const compactFrame = css({
  width: "760px",
  maxWidth: "100%",
  height: "760px",
  marginInline: "auto",
  border: "1px solid token(colors.border.default)",
  overflow: "hidden",
  "--app-shell-height": "100%",
});

/**
 * 600 to 900px (shown at 760px): the sheet and the reference share one rail
 * before the notes. Each opens as a flyout over the notes and can't be
 * pinned, so the notes keep the width. Below 600px the phone page takes
 * over.
 */
export const Compact: Story = {
  name: "Compact (760px)",
  parameters: { layout: "padded" },
  render: () => (
    <div className={compactFrame}>
      <WideGamePage flyouts />
    </div>
  ),
};

function ResponsiveGamePage() {
  const tier = useGamePageTier();
  if (tier === "phone") return <PhoneGamePage />;
  return (
    <WideGamePage stacked={tier === "medium"} flyouts={tier === "compact"} />
  );
}

/**
 * The current layout at every width, as the app picks it: three columns
 * from 1200px, the sheet and the reference stacked at the start from 900px
 * (each on a rail when collapsed), both on one rail as flyouts from 600px,
 * and the phone page below 600px, as `useIsMobile()` decides. Step
 * through the toolbar's viewports, from 1600 down to 390, or resize the
 * window with the canvas open on its own.
 */
export const Responsive: Story = {
  name: "Responsive, desktop to phone",
  globals: { viewport: { value: "r1440", isRotated: false } },
  render: () => <ResponsiveGamePage />,
};
