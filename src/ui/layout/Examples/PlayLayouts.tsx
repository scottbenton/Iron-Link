/**
 * The game page for players who play from the character sheet and take few
 * notes, from Iron Fellowship's character sheet. Story-only:
 * PlayLayouts.stories.tsx renders it. The real chrome (AppShell, NavRail,
 * NavBar, the game's page tabs, GameLayout's resizable, collapsible sidebar)
 * around the sheet as the main column:
 *
 * - The reference (Moves, Oracles, Game Log) is the start sidebar, as Iron
 *   Fellowship puts it.
 * - A band at the top: the character (a large portrait, with the name,
 *   player and initiative under it), then the stats, Adds as a meter and
 *   the meters in one row, all at their own widths.
 * - Assets, Tracks, Impacts and Legacy, and Notes as tabs in one card about
 *   three quarters of the screen tall that scrolls inside, so marking a track
 *   never loses the reader's place in a note.
 *
 * Layout follows width through CSS grid and flex wrapping and container
 * queries on the column the content sits in, never the window. `touch`
 * stands in for the app's `useIsTouchDevice()`: it makes steppers 44px,
 * which a coarse pointer would also do for buttons and stat cards.
 */
import type { Datasworn } from "@datasworn-community/core";
import {
  ChatsCircleIcon,
  DiceFiveIcon,
  HandFistIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { ReactNode, useState } from "react";

import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import {
  SectionTab,
  SectionTabList,
  SectionTabWell,
  TabPanel,
  Tabs,
} from "../../components/Tabs";
import { Text } from "../../components/Text";
import { AssetCard } from "../../game/AssetCard";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import {
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
import { getMoveRollOptions } from "../../game/MoveCard";
import type { MoveRollOption } from "../../game/MoveCard";
import { MoveListItem } from "../../game/MoveListItem";
import { ProgressTrack } from "../../game/ProgressTrack";
import { ReferenceCategory } from "../../game/ReferenceCategory";
import type { RollData } from "../../game/RollCard";
import { StatGrid } from "../../game/StatCard";
import { TracksPanelDemo } from "../../game/TracksPanel/TracksPanelDemo";
import { sampleCharacters } from "../../stories/fixtures/characters";
import {
  sampleAssets,
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
import { rollAction } from "./rollDice";
import { characterAuthor, gameLogEntries } from "./sampleLog";
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

/**
 * A large portrait with the name, the player and initiative stacked under
 * it, as tall as the stats and meters beside it once they wrap. The name is
 * the page's h1 already.
 */
function Identity(props: { sheet: PlaySheet }) {
  const { sheet } = props;
  return (
    <div className={identityStyles}>
      <CharacterPortrait
        name={character.name}
        size="xl"
        shape="rounded"
        colorScheme="cinder"
        decorative
      />
      <div className={identityTextStyles}>
        <Text variant="h3" as="p">
          {character.name}
        </Text>
        <span className={identityPlayerStyles}>
          <UserIcon aria-hidden />
          <Text variant="caption" color="muted">
            <span className={visuallyHidden()}>Played by </span>
            {character.playerName}
          </Text>
        </span>
        <div>
          <InitiativeChip
            status={sheet.initiative}
            onStatusChange={sheet.setInitiative}
          />
        </div>
      </div>
    </div>
  );
}

// Beside the portrait while the band is one column, so a narrow sheet does
// not spend a screen on it; stacked under it once the band has two.
const identityStyles = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "center",
  alignContent: "start",
  justifyItems: "start",
  gap: "3",
  minWidth: 0,
  "@container sheet (min-width: 760px)": {
    gridTemplateColumns: "minmax(0, 1fr)",
    alignItems: "start",
  },
});

const identityTextStyles = css({
  display: "grid",
  justifyItems: "start",
  gap: "1",
  minWidth: 0,
});

const identityPlayerStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  color: "fg.muted",
  "& > svg": { flex: "none", width: "14px", height: "14px" },
});

/**
 * Everything the character rolls, in one row: the five stats, then Adds as
 * a meter of its own (it changes whichever of them the next roll uses),
 * then Health, Spirit, Supply and Momentum, each at its own width. They wrap
 * to a second row when the column is narrow; nothing stretches to fill.
 */
function Rolls(props: { sheet: PlaySheet; touch?: boolean }) {
  const { sheet, touch } = props;
  const stepperSize = touch ? "touch" : undefined;
  return (
    <div className={rollsStyles}>
      <div className={rollRowStyles}>
        <section className={statsStyles} aria-labelledby="sheet-stats">
          <h3 id="sheet-stats" className={visuallyHidden()}>
            Stats
          </h3>
          <StatGrid
            stats={statKeys.map((key) => ({
              key,
              name: capitalize(key),
              value: character.stats[key],
            }))}
            adds={sheet.adds}
            onRoll={(stat) => sheet.roll(stat.name, stat.value)}
          />
        </section>
        <ConditionMeter
          label="Adds"
          value={sheet.adds}
          min={-9}
          max={9}
          stepperSize={stepperSize}
          onChange={sheet.setAdds}
          className={addsMeterStyles}
        />
        <section className={meterRowStyles} aria-labelledby="sheet-meters">
          <h3 id="sheet-meters" className={visuallyHidden()}>
            Meters
          </h3>
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
        </section>
      </div>
    </div>
  );
}

const rollsStyles = css({ display: "grid", gap: "3", minWidth: 0 });

const addsMeterStyles = css({ flex: "none" });

const rollRowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  gap: "3",
  minWidth: 0,
});

/** The stats at the width five cards need, never stretched. */
const statsStyles = css({
  flex: "0 1 400px",
  minWidth: "min(100%, 300px)",
});

const meterRowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  minWidth: 0,
  "& > [role=group]": { flex: "none" },
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
          <Rolls sheet={sheet} touch={touch} />
        </div>
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(String(next))}
          className={sheetFirstStyles.card}
        >
          <SectionTabWell className={sheetFirstStyles.cardTabs}>
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
  // The character over the rolls on a narrow column; beside them, both
  // from the top, once there is room.
  band: css({
    flex: "none",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "4",
    alignItems: "start",
    "@container sheet (min-width: 760px)": {
      gridTemplateColumns: "minmax(200px, max-content) minmax(0, 1fr)",
      columnGap: "6",
    },
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
