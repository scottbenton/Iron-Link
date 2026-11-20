/**
 * The game page for players who play from the character sheet and take few
 * notes, from Iron Fellowship's character sheet. Story-only:
 * PlayLayouts.stories.tsx renders it. The real chrome (AppShell, NavRail,
 * NavBar, the game's page tabs, GameLayout's resizable, collapsible sidebar)
 * around the sheet as the main column:
 *
 * - The reference (Moves, Oracles, Game Log) is the start sidebar, as Iron
 *   Fellowship puts it.
 * - Across the top, no card: the portrait, the name with initiative under
 *   it, then the Adds chip and the character's settings gear at the end.
 *   Under that the stats and the meters in one row, at their own widths,
 *   6px apart like the cards within each.
 * - Assets, Tracks, Impacts and Legacy, and Notes as tabs (at the start of
 *   their well, not centred, across a panel this wide) in one card about
 *   three quarters of the screen tall that scrolls inside, so marking a track
 *   never loses the reader's place in a note.
 *
 * Layout follows width through CSS grid and flex wrapping and container
 * queries on the column the content sits in, never the window. `touch`
 * stands in for the app's `useIsTouchDevice()`: it makes steppers 44px,
 * which a coarse pointer would also do for buttons and stat cards.
 */
import {
  ChatsCircleIcon,
  DiceFiveIcon,
  HandFistIcon,
} from "@phosphor-icons/react";
import { useState } from "react";

import { css } from "styled-system/css";

import {
  SectionTab,
  SectionTabList,
  SectionTabWell,
  TabPanel,
  Tabs,
} from "../../components/Tabs";
import { TracksPanelDemo } from "../../game/TracksPanel/TracksPanelDemo";
import { GameLayout } from "../GameLayout";
import type { LayoutPanel, LayoutSection } from "../shared/layoutPanel";
import { Assets } from "./Assets";
import { ColumnTabs } from "./ColumnTabs";
import { Impacts } from "./Impacts";
import { Legacy } from "./Legacy";
import { Log } from "./Log";
import { MoveTree } from "./MoveTree";
import { NotesColumn } from "./NotesColumn";
import { OracleTree } from "./OracleTree";
import { PlayShell } from "./PlayShell";
import { Rolls } from "./Rolls";
import { SheetHeader } from "./SheetHeader";
import { SheetSection } from "./SheetSection";
import { GamePageTabs } from "./StoryPlaceholders";
import { character } from "./playLayoutsShared";
import { usePlaySheet } from "./usePlaySheet";

/** Props every proposal takes. */
export interface PlayLayoutProps {
  /**
   * Size controls for fingers: 44px steppers. The app passes
   * `useIsTouchDevice()`, so a tablet gets the wide layout sized for touch.
   */
  touch?: boolean;
  /**
   * Let the reader keep the reference open beside the sheet (the default).
   * The app passes false below 1200px, where the sheet needs the width: the
   * reference stays on its rail and only opens over the sheet, with no
   * Expand or Keep Open. The reader's choice comes back above 1200px.
   */
  sidebarPinnable?: boolean;
  /** The character's name, to try long ones. */
  characterName?: string;
}

/** A side column's tab panel, scrolling under the pinned tabs. */
const columnPanelStyles = css({
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  padding: "4",
  "&[hidden]": { display: "none" },
});

/** The log's panel: the log scrolls itself and keeps its composer at the foot. */
const columnLogPanelStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
  "&[hidden]": { display: "none" },
});

/* ------------------------------------------------------------------------ */
/* 1. Sheet first                                                           */
/* ------------------------------------------------------------------------ */

const referenceSections: LayoutSection[] = [
  { id: "moves", title: "Moves", icon: <HandFistIcon /> },
  { id: "oracles", title: "Oracles", icon: <DiceFiveIcon /> },
  { id: "log", title: "Game Log", icon: <ChatsCircleIcon /> },
];

const sheetTabs = [
  { id: "assets", title: "Assets" },
  { id: "tracks", title: "Tracks" },
  { id: "legacy", title: "Impacts and Legacy" },
  { id: "notes", title: "Notes" },
];

/**
 * Iron Fellowship's character sheet: the character and their stats in a
 * band, the meters under it, then the rest of the sheet behind tabs, with
 * the notes as the last tab. The reference is the start sidebar.
 */
export function SheetFirstPage(props: PlayLayoutProps) {
  const {
    touch,
    sidebarPinnable = true,
    characterName = character.name,
  } = props;
  const sheet = usePlaySheet();
  const [referenceSection, setReferenceSection] = useState("moves");
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(320);
  const [tab, setTab] = useState("assets");

  const reference: LayoutPanel = {
    id: "reference",
    title: "Reference",
    sections: referenceSections,
    activeSectionId: referenceSection,
    onActiveSectionChange: setReferenceSection,
    content: (
      <ColumnTabs
        label="Reference Sections"
        sections={referenceSections}
        value={referenceSection}
        onValueChange={setReferenceSection}
      >
        <TabPanel value="moves" className={columnPanelStyles}>
          <MoveTree sheet={sheet} />
        </TabPanel>
        <TabPanel value="oracles" className={columnPanelStyles}>
          <OracleTree />
        </TabPanel>
        <TabPanel value="log" className={columnLogPanelStyles}>
          <Log sheet={sheet} />
        </TabPanel>
      </ColumnTabs>
    ),
  };

  const main = {
    id: "sheet",
    title: "Character Sheet",
    hideTitle: true,
    content: (
      <div className={sheetFirstStyles.page}>
        <div className={sheetFirstStyles.band}>
          <SheetHeader sheet={sheet} name={characterName} touch={touch} />
          <Rolls sheet={sheet} touch={touch} />
        </div>
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(String(next))}
          className={sheetFirstStyles.card}
        >
          <SectionTabWell align="start" className={sheetFirstStyles.cardTabs}>
            <SectionTabList aria-label="Sheet Sections" align="start">
              {sheetTabs.map((section) => (
                <SectionTab key={section.id} value={section.id}>
                  {section.title}
                </SectionTab>
              ))}
            </SectionTabList>
          </SectionTabWell>
          <TabPanel value="assets" className={sheetFirstStyles.panel}>
            <Assets />
          </TabPanel>
          <TabPanel value="tracks" className={sheetFirstStyles.panel}>
            <TracksPanelDemo />
          </TabPanel>
          <TabPanel value="legacy" className={sheetFirstStyles.panel}>
            <div className={sheetFirstStyles.twoUp}>
              <SheetSection title="Impacts">
                <Impacts sheet={sheet} />
              </SheetSection>
              <SheetSection title="Legacy Tracks">
                <Legacy sheet={sheet} />
              </SheetSection>
            </div>
          </TabPanel>
          <TabPanel value="notes" className={sheetFirstStyles.notesPanel}>
            <NotesColumn />
          </TabPanel>
        </Tabs>
      </div>
    ),
  };

  return (
    <PlayShell title={characterName}>
      <GameLayout
        tabs={<GamePageTabs current="kira" />}
        main={main}
        startSidebar={{
          panels: [reference],
          collapsed,
          onCollapsedChange: setCollapsed,
          pinnable: sidebarPinnable,
          width,
          onWidthChange: setWidth,
          minWidth: 280,
          maxWidth: 440,
        }}
      />
    </PlayShell>
  );
}

const sheetFirstStyles = {
  // At least the column's height, so the card below the band fills the
  // rest of it and scrolls inside rather than the page.
  page: css({
    containerType: "inline-size",
    containerName: "sheet",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "4",
    minHeight: "100%",
    width: "100%",
    maxWidth: "1200px",
    marginInline: "auto",
    padding: "5",
  }),
  // The character across the top, the rolls under it.
  band: css({
    flex: "none",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "4",
  }),
  // The tabs and their panel in one card, most of the screen's height (and
  // any room left below the band): the panel scrolls under the tabs, so
  // marking a track never moves a note. The page scrolls the band away to
  // show all of it.
  card: css({
    flex: "1 0 auto",
    height: "75lvh",
    minHeight: "28rem",
    display: "flex",
    flexDirection: "column",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "lg",
    background: "bg.surface",
    overflow: "hidden",
  }),
  cardTabs: css({
    flex: "none",
    borderRadius: 0,
    borderBottom: "1px solid token(colors.border.subtle)",
  }),
  panel: css({
    flex: "1 1 auto",
    minHeight: 0,
    minWidth: 0,
    overflowY: "auto",
    padding: "4",
    "&[hidden]": { display: "none" },
  }),
  // The notes bring their own tabs and toolbar and scroll themselves.
  notesPanel: css({
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minHeight: 0,
    minWidth: 0,
    "&[hidden]": { display: "none" },
  }),
  twoUp: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "5",
    alignItems: "start",
  }),
};
