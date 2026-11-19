/**
 * Layout proposals for players who play from the character sheet and take
 * few notes. Story-only: PlayLayouts.stories.tsx renders them. Each page is
 * the real chrome (AppShell, NavRail, NavBar, the game's page tabs,
 * GameLayout's resizable, collapsible sidebars) around a different main
 * column, and every one of them still reaches the notes.
 *
 * - Sheet first (Iron Fellowship's character sheet): the sheet is the main
 *   column, the reference (Moves, Oracles, Game Log) the start sidebar, as
 *   Iron Fellowship puts it. A band of the character and their stats, the
 *   meters under it, then Assets, Tracks, Legacy and Notes as tabs.
 * - Dashboard: the whole sheet at once, as tiles that flow into as many
 *   columns as fit, with the game log docked at the end. Moves, Oracles and
 *   Notes open in drawers from the page's toolbar.
 * - Moves first: a compact strip of the character over a wide reference,
 *   the move list beside the open move and the rolls it made. The rest of
 *   the sheet, the log and the notes sit in the end sidebar.
 *
 * Layout follows width through CSS grid (auto-fit and minmax) and container
 * queries on the column the content sits in, never the window. `touch`
 * stands in for the app's `useIsTouchDevice()`: it makes steppers 44px,
 * which a coarse pointer would also do for buttons and stat cards.
 */
import type { Datasworn } from "@datasworn-community/core";
import {
  BookOpenIcon,
  CardsIcon,
  ChatsCircleIcon,
  DiceFiveIcon,
  FlagBannerIcon,
  HandFistIcon,
  MedalIcon,
  NotePencilIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { ReactNode, useState } from "react";

import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Checkbox } from "../../components/Checkbox";
import { Drawer, DrawerBody, DrawerHeader } from "../../components/Drawer";
import { ListRow, ListRowButton } from "../../components/List";
import {
  SectionTab,
  SectionTabList,
  SectionTabWell,
  TabPanel,
  Tabs,
} from "../../components/Tabs";
import { Text } from "../../components/Text";
import { rollAction } from "../../examples/rollDice";
import { characterAuthor, gameLogEntries } from "../../examples/sampleLog";
import { AssetCard } from "../../game/AssetCard";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import {
  AddsControl,
  ConditionMeter,
  MomentumMeter,
  XPMeter,
} from "../../game/ConditionMeter";
import { GameLog } from "../../game/GameLog";
import type { GameLogEntry } from "../../game/GameLog";
import type { ImpactGroup } from "../../game/ImpactsChecklist";
import { ImpactsSummary } from "../../game/ImpactsSummary";
import { InitiativeChip } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { MoveCard, getMoveRollOptions } from "../../game/MoveCard";
import type { MoveRollOption } from "../../game/MoveCard";
import { MoveListItem } from "../../game/MoveListItem";
import { ProgressTrack } from "../../game/ProgressTrack";
import { ReferenceCategory } from "../../game/ReferenceCategory";
import { RollCard } from "../../game/RollCard";
import type { RollData } from "../../game/RollCard";
import { StatGrid } from "../../game/StatCard";
import { TracksPanelDemo } from "../../game/TracksPanel/TracksPanelDemo";
import { sampleCharacters } from "../../stories/fixtures/characters";
import {
  sampleAssets,
  sampleMoves,
  starforgedRules,
} from "../../stories/fixtures/datasworn";
import {
  OracleCollectionTree,
  moveCountLabel,
  starforgedMoveCategories,
  starforgedOracleCollections,
} from "../../stories/fixtures/referenceTrees";
import { AppShell } from "../AppShell";
import { GameLayout } from "../GameLayout";
import { NavBar } from "../NavBar";
import { NavRail } from "../NavRail";
import { SectionHeading } from "../SectionHeading";
import { DemoSettingsMenu } from "../SettingsMenu/SettingsMenuDemo";
import { guideScenario } from "../SettingsMenu/settingsMenuScenarios";
import { SidebarHeaderEnd } from "../Sidebar";
import type { LayoutPanel, LayoutSection } from "../shared/layoutPanel";
import { NotesColumn } from "./GamePageColumns";
import { GamePageTabs } from "./StoryPlaceholders";
import { getNavItems } from "./storyData";

/** Props every proposal takes. */
export interface PlayLayoutProps {
  /**
   * Size controls for fingers: 44px steppers. The app passes
   * `useIsTouchDevice()`, so a tablet gets the wide layout sized for touch.
   */
  touch?: boolean;
  /**
   * Start with the side column folded to its rail, as a portrait tablet
   * would. The reader can open it again; the app remembers the choice.
   */
  sidebarCollapsed?: boolean;
}

/* ------------------------------------------------------------------------ */
/* State shared by every proposal                                           */
/* ------------------------------------------------------------------------ */

const character = sampleCharacters[0];
const statKeys = ["edge", "heart", "iron", "shadow", "wits"] as const;
const meterKeys = ["health", "spirit", "supply"] as const;
type MeterKey = (typeof meterKeys)[number] | "momentum";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

type LooseImpacts = Record<
  string,
  { label: string; contents: Record<string, { label: string }> }
>;
const impactGroups: ImpactGroup[] = Object.entries(
  starforgedRules.rules.impacts as LooseImpacts,
).map(([key, group]) => ({
  key,
  label: group.label,
  impacts: Object.entries(group.contents).map(([impactKey, impact]) => ({
    key: impactKey,
    label: impact.label,
  })),
}));

const legacyTracks = [
  { key: "quests", label: "Quests", ticks: 14 },
  { key: "bonds", label: "Bonds", ticks: 6 },
  { key: "discoveries", label: "Discoveries", ticks: 9 },
];

/** Kira's sheet and the game's log, with rolls that land in the log. */
function usePlaySheet() {
  const [meters, setMeters] = useState(character.meters);
  const [adds, setAdds] = useState(0);
  const [initiative, setInitiative] =
    useState<InitiativeStatus>("hasInitiative");
  const [impacts, setImpacts] = useState<Record<string, boolean>>({
    wounded: true,
  });
  const [xp, setXp] = useState(4);
  const [legacyTicks, setLegacyTicks] = useState<Record<string, number>>(() =>
    Object.fromEntries(legacyTracks.map((t) => [t.key, t.ticks])),
  );
  const [entries, setEntries] = useState<GameLogEntry[]>(gameLogEntries);
  const [recentRolls, setRecentRolls] = useState<
    { id: string; roll: RollData }[]
  >([]);

  const addRoll = (roll: RollData) => {
    const id = `roll-${Date.now()}-${Math.random()}`;
    setRecentRolls((current) => [{ id, roll }, ...current].slice(0, 3));
    setEntries((current) => [
      ...current,
      {
        kind: "roll",
        id,
        author: characterAuthor(character, true),
        timestamp: new Date(),
        roll,
      },
    ]);
  };

  /** Rolls a stat or meter with the adds, which then reset to 0. */
  const roll = (name: string, value: number, moveName?: string) => {
    const result = rollAction(name, value + adds, moveName, meters.momentum);
    addRoll({ ...result, statValue: value, adds: adds || undefined });
    setAdds(0);
  };

  const statValue = (key: string): number | undefined =>
    key in character.stats
      ? character.stats[key as keyof typeof character.stats]
      : key in meters
        ? meters[key as MeterKey]
        : undefined;

  return {
    meters,
    setMeter: (key: MeterKey, value: number) =>
      setMeters((current) => ({ ...current, [key]: value })),
    adds,
    setAdds,
    initiative,
    setInitiative,
    impacts,
    setImpact: (key: string, marked: boolean) =>
      setImpacts((current) => ({ ...current, [key]: marked })),
    xp,
    setXp,
    legacyTicks,
    setLegacyTicks: (key: string, ticks: number) =>
      setLegacyTicks((current) => ({ ...current, [key]: ticks })),
    entries,
    send: (message: string) =>
      setEntries((current) => [
        ...current,
        {
          kind: "message",
          id: `message-${current.length}`,
          author: characterAuthor(character, true),
          timestamp: new Date(),
          message,
        },
      ]),
    recentRolls,
    dismissRoll: (id: string) =>
      setRecentRolls((current) => current.filter((item) => item.id !== id)),
    roll,
    /** A move's roll buttons, with Kira's values. */
    moveRollOptions: (move: Datasworn.AnyMove): MoveRollOption[] =>
      getMoveRollOptions(move).map((option) => ({
        ...option,
        value: statValue(option.id),
      })),
  };
}

type PlaySheet = ReturnType<typeof usePlaySheet>;

/* ------------------------------------------------------------------------ */
/* Sheet pieces                                                             */
/* ------------------------------------------------------------------------ */

/** Portrait, name and initiative. The name is the page's h1 already. */
function Identity(props: { sheet: PlaySheet; compact?: boolean }) {
  const { sheet, compact } = props;
  return (
    <div className={identityStyles}>
      <CharacterPortrait
        name={character.name}
        size={compact ? "md" : "lg"}
        shape="rounded"
        decorative
      />
      <div className={identityTextStyles}>
        <Text variant={compact ? "h4" : "h3"} as="p">
          {character.name}
        </Text>
        <div className={identityMetaStyles}>
          <InitiativeChip
            status={sheet.initiative}
            onStatusChange={sheet.setInitiative}
          />
          {!compact && (
            <Text variant="caption" color="muted">
              Played by {character.playerName}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}

const identityStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  minWidth: 0,
});

const identityTextStyles = css({
  display: "grid",
  gap: "1",
  minWidth: 0,
});

const identityMetaStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "2",
});

/** Adds over the five stats, each a roll button. */
function Stats(props: { sheet: PlaySheet; touch?: boolean }) {
  const { sheet, touch } = props;
  return (
    <div className={stackStyles}>
      <AddsControl
        value={sheet.adds}
        onChange={sheet.setAdds}
        stepperSize={touch ? "touch" : undefined}
      />
      <StatGrid
        stats={statKeys.map((key) => ({
          key,
          name: capitalize(key),
          value: character.stats[key],
        }))}
        adds={sheet.adds}
        onRoll={(stat) => sheet.roll(stat.name, stat.value)}
      />
    </div>
  );
}

/**
 * Health, Spirit, Supply and Momentum, as many to a row as fit at a meter's
 * own minimum width.
 */
function Meters(props: { sheet: PlaySheet; touch?: boolean }) {
  const { sheet, touch } = props;
  const stepperSize = touch ? "touch" : undefined;
  return (
    <div className={meterGridStyles}>
      {meterKeys.map((meter) => (
        <ConditionMeter
          key={meter}
          label={capitalize(meter)}
          value={sheet.meters[meter]}
          max={5}
          warnAtMin
          adds={sheet.adds}
          stepperSize={stepperSize}
          onChange={(value) => sheet.setMeter(meter, value)}
          onRoll={() => sheet.roll(capitalize(meter), sheet.meters[meter])}
        />
      ))}
      <MomentumMeter
        value={sheet.meters.momentum}
        stepperSize={stepperSize}
        onChange={(value) => sheet.setMeter("momentum", value)}
        onBurn={() => sheet.setMeter("momentum", 2)}
      />
    </div>
  );
}

const meterGridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))",
  gap: "2",
  alignItems: "start",
});

function Impacts(props: { sheet: PlaySheet }) {
  const { sheet } = props;
  return (
    <ImpactsSummary
      groups={impactGroups}
      value={sheet.impacts}
      onImpactChange={sheet.setImpact}
    />
  );
}

function Legacy(props: { sheet: PlaySheet }) {
  const { sheet } = props;
  return (
    <div className={stackStyles}>
      {legacyTracks.map((track) => (
        <ProgressTrack
          key={track.key}
          label={track.label}
          ticks={sheet.legacyTicks[track.key]}
          onChange={(ticks) => sheet.setLegacyTicks(track.key, ticks)}
          legacy
        />
      ))}
      <XPMeter
        label="Unspent Experience"
        value={sheet.xp}
        onChange={sheet.setXp}
      />
    </div>
  );
}

/**
 * The character's assets, as many to a row as fit at 300px: one in a side
 * column, two or three across a main column.
 */
function Assets(props: { compact?: boolean; headingAs?: "h3" | "h4" }) {
  const { compact, headingAs = "h3" } = props;
  return (
    <div className={stackStyles}>
      <div className={assetActionsStyles}>
        <Checkbox label="Show all abilities" size="sm" />
        <Button size="sm" variant="outline">
          Add Assets
        </Button>
      </div>
      <div className={compact ? stackStyles : assetGridStyles}>
        <AssetCard
          asset={sampleAssets.starship}
          state={{ controlValues: { integrity: 4 } }}
          headingAs={headingAs}
          collapsed={compact}
        />
        <AssetCard
          asset={sampleAssets.ace}
          headingAs={headingAs}
          collapsed={compact}
        />
        <AssetCard
          asset={sampleAssets.navigator}
          headingAs={headingAs}
          collapsed={compact}
        />
      </div>
    </div>
  );
}

const assetActionsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "2",
});

const assetGridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
  gap: "3",
  alignItems: "start",
});

const stackStyles = css({ display: "grid", gap: "3", minWidth: 0 });

/** A headed part of the sheet. */
function SheetSection(props: {
  title: string;
  as?: "h2" | "h3";
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { title, as = "h3", actions, children } = props;
  return (
    <section className={sheetSectionStyles}>
      <SectionHeading title={title} as={as} actions={actions} />
      {children}
    </section>
  );
}

const sheetSectionStyles = css({ display: "grid", gap: "2", minWidth: 0 });

/* ------------------------------------------------------------------------ */
/* Reference and log                                                        */
/* ------------------------------------------------------------------------ */

const openCategoryIds = new Set([
  "move_category:starforged/adventure",
  "move_category:starforged/combat",
  "oracle_collection:starforged/core",
]);

/** Starforged's moves, each opening in place with Kira's roll buttons. */
function MoveTree(props: { sheet: PlaySheet }) {
  const { sheet } = props;
  return (
    <div className={treeStyles}>
      {starforgedMoveCategories.map((category) => (
        <ReferenceCategory
          key={category._id ?? category.name}
          title={category.name}
          count={Object.keys(category.contents).length}
          countLabel={moveCountLabel}
          defaultOpen={!!category._id && openCategoryIds.has(category._id)}
        >
          {Object.values(category.contents).map((move) => (
            <MoveListItem
              key={move._id}
              move={move}
              moveCardProps={{
                rollOptions: sheet.moveRollOptions(move),
                onRoll: (option) =>
                  sheet.roll(option.label, option.value ?? 0, move.name),
              }}
            />
          ))}
        </ReferenceCategory>
      ))}
    </div>
  );
}

function OracleTree() {
  return (
    <div className={treeStyles}>
      {starforgedOracleCollections.map((collection) => (
        <OracleCollectionTree
          key={collection._id}
          collection={collection}
          openIds={openCategoryIds}
        />
      ))}
    </div>
  );
}

const treeStyles = css({ display: "grid", gap: "2", minWidth: 0 });

/** The game log, filling the height it is given. */
function Log(props: { sheet: PlaySheet }) {
  const { sheet } = props;
  return (
    <div className={logStyles}>
      <GameLog entries={sheet.entries} onSend={sheet.send} />
    </div>
  );
}

const logStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  height: "100%",
  minHeight: 0,
});

/* ------------------------------------------------------------------------ */
/* Page frame                                                               */
/* ------------------------------------------------------------------------ */

/** The app's chrome around a proposal: rail, bar (its h1), page tabs. */
function PlayShell(props: { children: ReactNode }) {
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
          title={character.name}
          backHref="#overview"
          actions={<DemoSettingsMenu scenario={guideScenario} />}
        />
      }
    >
      {props.children}
    </AppShell>
  );
}

/**
 * A side column's tabs in a well, with the column's own controls (Collapse)
 * at its end, as the game page's columns do.
 */
function ColumnTabs(props: {
  label: string;
  sections: LayoutSection[];
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  const { label, sections, value, onValueChange, children } = props;
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      className={columnTabsStyles}
    >
      <div className={columnTabRowStyles}>
        <SectionTabWell end={<SidebarHeaderEnd />}>
          <SectionTabList aria-label={label}>
            {sections.map((section) => (
              <SectionTab key={section.id} value={section.id}>
                {section.title}
              </SectionTab>
            ))}
          </SectionTabList>
        </SectionTabWell>
      </div>
      {children}
    </Tabs>
  );
}

const columnTabsStyles = css({
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

const columnTabRowStyles = css({
  flex: "none",
  position: "sticky",
  top: 0,
  zIndex: 2,
});

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
  const { touch, sidebarCollapsed = false } = props;
  const sheet = usePlaySheet();
  const [referenceSection, setReferenceSection] = useState("moves");
  const [collapsed, setCollapsed] = useState(sidebarCollapsed);
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
          <Identity sheet={sheet} />
          <section className={sheetSectionStyles}>
            <h3 className={visuallyHidden()}>Stats</h3>
            <Stats sheet={sheet} touch={touch} />
          </section>
        </div>
        <SheetSection title="Meters">
          <Meters sheet={sheet} touch={touch} />
        </SheetSection>
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(String(next))}
          className={sheetFirstStyles.tabs}
        >
          <SectionTabWell>
            <SectionTabList aria-label="Sheet Sections">
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
    <PlayShell>
      <GameLayout
        tabs={<GamePageTabs current="kira" />}
        main={main}
        startSidebar={{
          panels: [reference],
          collapsed,
          onCollapsedChange: setCollapsed,
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
  page: css({
    containerType: "inline-size",
    containerName: "sheet",
    boxSizing: "border-box",
    display: "grid",
    gap: "5",
    alignContent: "start",
    width: "100%",
    maxWidth: "1200px",
    marginInline: "auto",
    padding: "5",
  }),
  // One column on a narrow main column; the character beside the stats
  // once both fit at their own widths.
  band: css({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "4",
    alignItems: "center",
    paddingBlockEnd: "4",
    borderBottom: "1px solid token(colors.border.subtle)",
    "@container sheet (min-width: 680px)": {
      gridTemplateColumns: "minmax(220px, 1fr) minmax(330px, 460px)",
    },
  }),
  tabs: css({ display: "grid", gap: "4", minWidth: 0 }),
  panel: css({ minWidth: 0, "&[hidden]": { display: "none" } }),
  notesPanel: css({
    height: "560px",
    minWidth: 0,
    border: "1px solid token(colors.border.default)",
    borderRadius: "lg",
    overflow: "hidden",
    "&[hidden]": { display: "none" },
  }),
  twoUp: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "5",
    alignItems: "start",
  }),
};

/* ------------------------------------------------------------------------ */
/* 2. Dashboard                                                             */
/* ------------------------------------------------------------------------ */

type DashboardDrawer = "moves" | "oracles" | "notes" | null;

/** A dashboard tile: a flat card with its own heading. */
function Tile(props: {
  title: string;
  wide?: boolean;
  full?: boolean;
  children: ReactNode;
}) {
  const { title, wide, full, children } = props;
  return (
    <Card
      render={<section />}
      className={
        full
          ? dashboardStyles.tileFull
          : wide
            ? dashboardStyles.tileWide
            : dashboardStyles.tile
      }
    >
      <Text variant="label" as="h3">
        {title}
      </Text>
      {children}
    </Card>
  );
}

/**
 * The whole sheet at once: tiles flow into as many 300px columns as fit,
 * the tracks two columns wide and the assets the full width once there is
 * room. The log is the end sidebar; moves, oracles and notes are drawers.
 */
export function DashboardPage(props: PlayLayoutProps) {
  const { touch, sidebarCollapsed = false } = props;
  const sheet = usePlaySheet();
  const [drawer, setDrawer] = useState<DashboardDrawer>(null);
  const [collapsed, setCollapsed] = useState(sidebarCollapsed);
  const [width, setWidth] = useState(touch ? 300 : 360);
  const close = () => setDrawer(null);

  const log: LayoutPanel = {
    id: "log",
    title: "Game Log",
    icon: <ChatsCircleIcon />,
    content: <Log sheet={sheet} />,
  };

  const main = {
    id: "sheet",
    title: "Character Sheet",
    hideTitle: true,
    content: (
      <div className={dashboardStyles.page}>
        <div className={dashboardStyles.toolbar}>
          <Identity sheet={sheet} compact />
          <div className={dashboardStyles.tools}>
            <Button
              variant="outline"
              startIcon={<HandFistIcon />}
              onClick={() => setDrawer("moves")}
            >
              Moves
            </Button>
            <Button
              variant="outline"
              startIcon={<DiceFiveIcon />}
              onClick={() => setDrawer("oracles")}
            >
              Oracles
            </Button>
            <Button
              variant="ghost"
              startIcon={<NotePencilIcon />}
              onClick={() => setDrawer("notes")}
            >
              Notes
            </Button>
          </div>
        </div>
        <div className={dashboardStyles.tiles}>
          <Tile title="Stats">
            <Stats sheet={sheet} touch={touch} />
          </Tile>
          <Tile title="Meters">
            <Meters sheet={sheet} touch={touch} />
          </Tile>
          <Tile title="Impacts">
            <Impacts sheet={sheet} />
          </Tile>
          <Tile title="Tracks" wide>
            <TracksPanelDemo headingAs="h4" />
          </Tile>
          <Tile title="Legacy and Experience">
            <Legacy sheet={sheet} />
          </Tile>
          <Tile title="Assets" full>
            <Assets headingAs="h4" />
          </Tile>
        </div>
      </div>
    ),
  };

  return (
    <PlayShell>
      <GameLayout
        tabs={<GamePageTabs current="kira" />}
        main={main}
        mainMinWidth={320}
        endSidebar={{
          panels: [log],
          collapsed,
          onCollapsedChange: setCollapsed,
          width,
          onWidthChange: setWidth,
          minWidth: 280,
          maxWidth: 480,
        }}
      />
      <Drawer open={drawer === "moves"} onClose={close} side="left" size="lg">
        <DrawerHeader title="Moves" />
        <DrawerBody>
          <MoveTree sheet={sheet} />
        </DrawerBody>
      </Drawer>
      <Drawer open={drawer === "oracles"} onClose={close} side="left" size="lg">
        <DrawerHeader title="Oracles" />
        <DrawerBody>
          <OracleTree />
        </DrawerBody>
      </Drawer>
      <Drawer open={drawer === "notes"} onClose={close} size="lg">
        <DrawerHeader title="Notes" />
        <DrawerBody className={dashboardStyles.notesBody}>
          <NotesColumn />
        </DrawerBody>
      </Drawer>
    </PlayShell>
  );
}

const dashboardStyles = {
  page: css({
    boxSizing: "border-box",
    display: "grid",
    gap: "4",
    alignContent: "start",
    padding: "5",
  }),
  toolbar: css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "3",
  }),
  tools: css({ display: "flex", flexWrap: "wrap", gap: "2" }),
  // The container the tiles' spans read: a span only applies once the
  // grid has that many columns (300px each, 16px gaps).
  tiles: css({
    containerType: "inline-size",
    containerName: "tiles",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
    gridAutoFlow: "row dense",
    gap: "4",
    alignItems: "start",
  }),
  tile: css({ minWidth: 0 }),
  tileWide: css({
    minWidth: 0,
    "@container tiles (min-width: 616px)": { gridColumn: "span 2" },
  }),
  tileFull: css({ minWidth: 0, gridColumn: "1 / -1" }),
  notesBody: css({ padding: 0, display: "flex", flexDirection: "column" }),
};

/* ------------------------------------------------------------------------ */
/* 3. Moves first                                                           */
/* ------------------------------------------------------------------------ */

const sheetPanelSections: LayoutSection[] = [
  { id: "assets", title: "Assets", icon: <CardsIcon /> },
  { id: "tracks", title: "Tracks", icon: <FlagBannerIcon /> },
  { id: "legacy", title: "Impacts and Legacy", icon: <MedalIcon /> },
  { id: "log", title: "Game Log", icon: <ChatsCircleIcon /> },
  { id: "notes", title: "Notes", icon: <NotePencilIcon /> },
];

/**
 * A compact strip of the character (stats and meters, the things a move
 * rolls) over the reference at full width: the move list beside the open
 * move and its latest rolls. The rest of the sheet, the log and the notes
 * are the end sidebar's tabs.
 */
export function MovesFirstPage(props: PlayLayoutProps) {
  const { touch, sidebarCollapsed = false } = props;
  const sheet = usePlaySheet();
  const [move, setMove] = useState<Datasworn.AnyMove>(sampleMoves.faceDanger);
  const [referenceTab, setReferenceTab] = useState("moves");
  const [sheetSection, setSheetSection] = useState("assets");
  const [collapsed, setCollapsed] = useState(sidebarCollapsed);
  // Wide enough for the five section tabs beside Collapse.
  const [width, setWidth] = useState(420);

  const sheetPanel: LayoutPanel = {
    id: "character",
    title: "Character",
    icon: <UserIcon />,
    sections: sheetPanelSections,
    activeSectionId: sheetSection,
    onActiveSectionChange: setSheetSection,
    content: (
      <ColumnTabs
        label="Character Sections"
        sections={sheetPanelSections.map((section) =>
          section.id === "legacy" ? { ...section, title: "Legacy" } : section,
        )}
        value={sheetSection}
        onValueChange={setSheetSection}
      >
        <TabPanel value="assets" className={columnPanelStyles}>
          <Assets compact />
        </TabPanel>
        <TabPanel value="tracks" className={columnPanelStyles}>
          <TracksPanelDemo />
        </TabPanel>
        <TabPanel value="legacy" className={columnPanelStyles}>
          <div className={stackStyles}>
            <SheetSection title="Impacts">
              <Impacts sheet={sheet} />
            </SheetSection>
            <SheetSection title="Legacy Tracks">
              <Legacy sheet={sheet} />
            </SheetSection>
          </div>
        </TabPanel>
        <TabPanel value="log" className={columnLogPanelStyles}>
          <Log sheet={sheet} />
        </TabPanel>
        <TabPanel value="notes" className={columnLogPanelStyles}>
          <NotesColumn />
        </TabPanel>
      </ColumnTabs>
    ),
  };

  const main = {
    id: "reference",
    title: "Moves and Oracles",
    hideTitle: true,
    content: (
      <div className={movesFirstStyles.page}>
        <section
          className={movesFirstStyles.stripFrame}
          aria-labelledby="moves-first-strip"
        >
          <h3 id="moves-first-strip" className={visuallyHidden()}>
            Stats and Meters
          </h3>
          <div className={movesFirstStyles.strip}>
            <Identity sheet={sheet} compact />
            <Stats sheet={sheet} touch={touch} />
            <div className={movesFirstStyles.stripMeters}>
              <Meters sheet={sheet} touch={touch} />
            </div>
          </div>
        </section>
        <div className={movesFirstStyles.browserFrame}>
          <div className={movesFirstStyles.browser}>
            <Tabs
              value={referenceTab}
              onValueChange={(next) => setReferenceTab(String(next))}
              className={movesFirstStyles.listPane}
            >
              <SectionTabWell>
                <SectionTabList aria-label="Reference">
                  <SectionTab value="moves" icon={<HandFistIcon />}>
                    Moves
                  </SectionTab>
                  <SectionTab value="oracles" icon={<BookOpenIcon />}>
                    Oracles
                  </SectionTab>
                </SectionTabList>
              </SectionTabWell>
              <TabPanel value="moves" className={movesFirstStyles.listPanel}>
                <MovePicker current={move} onSelect={setMove} />
              </TabPanel>
              <TabPanel value="oracles" className={movesFirstStyles.listPanel}>
                <OracleTree />
              </TabPanel>
            </Tabs>
            <div className={movesFirstStyles.detailPane}>
              <MoveCard
                move={move}
                headingAs="h3"
                rollOptions={sheet.moveRollOptions(move)}
                onRoll={(option) =>
                  sheet.roll(option.label, option.value ?? 0, move.name)
                }
              />
              <section className={sheetSectionStyles}>
                <SectionHeading title="Latest Rolls" as="h3" />
                {sheet.recentRolls.length === 0 ? (
                  <Text variant="bodySm" color="muted">
                    Roll a move or a stat and the result shows here and in the
                    game log.
                  </Text>
                ) : (
                  <div className={movesFirstStyles.rolls}>
                    {sheet.recentRolls.map((item) => (
                      <RollCard
                        key={item.id}
                        roll={item.roll}
                        onDismiss={() => sheet.dismissRoll(item.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <PlayShell>
      <GameLayout
        tabs={<GamePageTabs current="kira" />}
        main={main}
        endSidebar={{
          panels: [sheetPanel],
          collapsed,
          onCollapsedChange: setCollapsed,
          width,
          onWidthChange: setWidth,
          minWidth: 400,
          maxWidth: 520,
        }}
      />
    </PlayShell>
  );
}

/** The move list as rows that open a move beside it. */
function MovePicker(props: {
  current: Datasworn.AnyMove;
  onSelect: (move: Datasworn.AnyMove) => void;
}) {
  const { current, onSelect } = props;
  return (
    <div className={treeStyles}>
      {starforgedMoveCategories.map((category) => (
        <ReferenceCategory
          key={category._id ?? category.name}
          title={category.name}
          count={Object.keys(category.contents).length}
          countLabel={moveCountLabel}
          defaultOpen={!!category._id && openCategoryIds.has(category._id)}
        >
          {Object.values(category.contents).map((move) => (
            <ListRow key={move._id}>
              <ListRowButton
                current={move._id === current._id}
                onClick={() => onSelect(move)}
              >
                <span data-row-name="">{move.name}</span>
              </ListRowButton>
            </ListRow>
          ))}
        </ReferenceCategory>
      ))}
    </div>
  );
}

const movesFirstStyles = {
  page: css({
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
  }),
  stripFrame: css({
    containerType: "inline-size",
    containerName: "strip",
    flex: "none",
    paddingBlock: "3",
    paddingInline: "4",
    borderBottom: "1px solid token(colors.border.default)",
    background: "bg.canvas",
  }),
  // One column, then the character beside the stats with the meters under
  // both, then all three in one row once the meters fit four across.
  strip: css({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "3",
    alignItems: "center",
    "@container strip (min-width: 640px)": {
      gridTemplateColumns: "minmax(180px, auto) minmax(330px, 1fr)",
    },
    "@container strip (min-width: 1120px)": {
      gridTemplateColumns:
        "minmax(180px, auto) minmax(330px, 440px) minmax(480px, 1fr)",
    },
  }),
  stripMeters: css({
    minWidth: 0,
    "@container strip (min-width: 640px)": { gridColumn: "1 / -1" },
    "@container strip (min-width: 1120px)": { gridColumn: "auto" },
  }),
  browserFrame: css({
    containerType: "inline-size",
    containerName: "browser",
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minHeight: 0,
  }),
  // Narrow: the list over the open move, scrolling together. Wide: the
  // list and the move side by side, each scrolling on its own.
  browser: css({
    flex: "1 1 auto",
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    alignContent: "start",
    overflowY: "auto",
    "@container browser (min-width: 720px)": {
      gridTemplateColumns: "minmax(250px, 320px) minmax(0, 1fr)",
      gridTemplateRows: "minmax(0, 1fr)",
      overflowY: "hidden",
    },
  }),
  listPane: css({
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    "@container browser (min-width: 720px)": {
      borderInlineEnd: "1px solid token(colors.border.subtle)",
    },
  }),
  listPanel: css({
    flex: "1 1 auto",
    minHeight: 0,
    padding: "4",
    "@container browser (min-width: 720px)": { overflowY: "auto" },
    "&[hidden]": { display: "none" },
  }),
  detailPane: css({
    boxSizing: "border-box",
    display: "grid",
    gap: "5",
    alignContent: "start",
    minHeight: 0,
    width: "100%",
    maxWidth: "760px",
    padding: "5",
    "@container browser (min-width: 720px)": { overflowY: "auto" },
  }),
  rolls: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
    gap: "3",
    alignItems: "start",
  }),
};
