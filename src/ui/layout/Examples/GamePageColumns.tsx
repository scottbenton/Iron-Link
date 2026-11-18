/**
 * The game page's three columns, built from the library and arranged as the
 * live app arranges them. Story-only: the GamePage, GameLayout and Playing a
 * game stories use these.
 *
 * - Character (live `CharacterSidebarContents`): the column's h2 with the
 *   character's menu, then Overview, Assets and Tracks tabs. Overview holds
 *   the details, Stats, Meters, Impacts, Legacy Tracks and Experience, in
 *   that order; Assets the asset cards; Tracks the TracksPanel (vows,
 *   journeys, fights, scene challenges, clocks and connections).
 * - Notes (live `NotesSection`): the open notes as tabs, its h2 for screen
 *   readers only. With `pinLog` the game log is a pinned first tab here
 *   instead of a Reference tab (a mockup; the live app has no such option).
 * - Reference (live `ReferenceSidebarContents`): Moves, Oracles and Game
 *   Log tabs, each scrolling under the pinned tab row.
 */
import {
  ChatsCircleIcon,
  DotsThreeIcon,
  PlusIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { useState } from "react";

import { css, cva } from "styled-system/css";
import { Box, Flex, HStack, Stack } from "styled-system/jsx";

import { BreadcrumbItem, Breadcrumbs } from "../../components/Breadcrumbs";
import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import {
  NoteTabPanel,
  NoteTabs,
  SectionTab,
  SectionTabList,
  SectionTabsVariant,
  TabPanel,
  Tabs,
} from "../../components/Tabs";
import { Text } from "../../components/Text";
import { characterAuthor, gameLogEntries } from "../../examples/sampleLog";
import { AssetCard } from "../../game/AssetCard";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import {
  AddsControl,
  ConditionMeter,
  MomentumMeter,
} from "../../game/ConditionMeter";
import { GameLog } from "../../game/GameLog";
import type { GameLogEntry } from "../../game/GameLog";
import type { ImpactGroup } from "../../game/ImpactsChecklist";
import { ImpactsSummary } from "../../game/ImpactsSummary";
import { InitiativeChip } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { ProgressTrack } from "../../game/ProgressTrack";
import { StatGrid } from "../../game/StatCard";
import { TracksPanelDemo } from "../../game/TracksPanel/TracksPanelDemo";
import { XPMeter } from "../../game/XPTrack";
import {
  SampleCharacter,
  sampleCharacters,
} from "../../stories/fixtures/characters";
import {
  sampleAssets,
  starforgedRules,
} from "../../stories/fixtures/datasworn";
import {
  MoveCategoryTree,
  OracleCollectionTree,
  starforgedMoveCategories,
  starforgedOracleCollections,
} from "../../stories/fixtures/referenceTrees";
import { ActionToolbar, ActionToolbarIconButton } from "../ActionToolbar";
import { SectionHeading } from "../SectionHeading";
import { DemoCharacterSettingsMenu } from "../SettingsMenu/SettingsMenuDemo";
import { characterSections, getReferenceSections } from "./columnSections";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** Tabs at the top of a column, with the panels under them. */
const columnTabsStyles = css({
  display: "flex",
  flexDirection: "column",
  minHeight: "100%",
});

/**
 * The row holding a column's tabs. A band or a well runs edge to edge; the
 * others sit inside the column's margins.
 */
const tabRowStyles = cva({
  base: { flex: "none", paddingInline: "4", paddingBlock: "3" },
  variants: {
    variant: {
      segmented: {},
      chips: {},
      underline: { paddingBlockEnd: "4" },
      band: { paddingInline: 0, paddingBlock: 0, marginBlockEnd: "4" },
      accent: { paddingBlock: "1", marginBlockEnd: "3" },
      pills: {},
      well: { paddingInline: 0, paddingBlock: 0, marginBlockEnd: "4" },
    },
  },
  defaultVariants: { variant: "well" },
});

/** Props the game page's columns share for their own tabs. */
export interface ColumnTabsProps {
  /**
   * The look of the column's tab row: chips in a well by default, the
   * note tabs' look, so the three columns' tabs read as one family.
   */
  tabsVariant?: SectionTabsVariant;
  /** The tab showing. Uncontrolled without it. */
  section?: string;
  onSectionChange?: (section: string) => void;
}

const sheetPanelStyles = css({
  paddingInline: "4",
  paddingBlockEnd: "6",
});

/* ------------------------------------------------------------------------ */
/* Character                                                                */
/* ------------------------------------------------------------------------ */

const statKeys = ["edge", "heart", "iron", "shadow", "wits"] as const;
const meterKeys = ["health", "spirit", "supply"] as const;

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

/**
 * The character column's menu, as in the live column header: only Kira's
 * own actions, a shortcut to the rail's combined SettingsMenu.
 */
export function CharacterColumnActions() {
  return <DemoCharacterSettingsMenu />;
}

/** The character sheet: Overview, Assets and Tracks, as in the live app. */
export function CharacterColumn(
  props: { character?: SampleCharacter } & ColumnTabsProps,
) {
  const {
    character = sampleCharacters[0],
    tabsVariant = "well",
    section,
    onSectionChange,
  } = props;
  const [meters, setMeters] = useState(character.meters);
  // Adds apply to the next roll, then reset to 0, as the live app does.
  const [adds, setAdds] = useState(0);
  const rollWithAdds = () => setAdds(0);
  const [initiative, setInitiative] = useState<InitiativeStatus>("outOfCombat");
  const [impacts, setImpacts] = useState<Record<string, boolean>>({
    wounded: true,
  });
  const [xp, setXp] = useState(4);

  return (
    <Tabs
      defaultValue="overview"
      value={section}
      onValueChange={(value) => onSectionChange?.(String(value))}
      className={columnTabsStyles}
    >
      <div className={tabRowStyles({ variant: tabsVariant })}>
        <SectionTabList
          aria-label="Character Sections"
          variant={tabsVariant}
          fullWidth={tabsVariant !== "accent" && tabsVariant !== "pills"}
        >
          {characterSections.map((tab) => (
            <SectionTab key={tab.id} value={tab.id}>
              {tab.title}
            </SectionTab>
          ))}
        </SectionTabList>
      </div>

      <TabPanel value="overview" className={sheetPanelStyles}>
        <Stack gap="6">
          <HStack gap="3" alignItems="center">
            <CharacterPortrait
              name={character.name}
              colorSeed={character.colorSeed}
              size="lg"
              shape="rounded"
              decorative
            />
            <Stack gap="1" minWidth="0">
              <Text variant="h3" as="h3">
                {character.name}
              </Text>
              <Flex gap="2" flexWrap="wrap" alignItems="center">
                <InitiativeChip
                  status={initiative}
                  onStatusChange={setInitiative}
                />
                <Text variant="caption" color="muted">
                  Played by {character.playerName}
                </Text>
              </Flex>
            </Stack>
          </HStack>

          {/* Adds sit above the stats: they change whichever stat or meter
              the next roll uses. */}
          <Stack gap="3">
            <AddsControl value={adds} onChange={setAdds} />
            <Stack gap="2" as="section">
              <SectionHeading title="Stats" as="h3" variant="band" />
              <StatGrid
                stats={statKeys.map((key) => ({
                  key,
                  name: capitalize(key),
                  value: character.stats[key],
                }))}
                adds={adds}
                onRoll={rollWithAdds}
              />
            </Stack>
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading title="Meters" as="h3" variant="band" />
            <Flex gap="2" flexWrap="wrap">
              {meterKeys.map((meter) => (
                <ConditionMeter
                  key={meter}
                  label={capitalize(meter)}
                  value={meters[meter]}
                  max={5}
                  warnAtMin
                  adds={adds}
                  onChange={(value) =>
                    setMeters((current) => ({ ...current, [meter]: value }))
                  }
                  onRoll={rollWithAdds}
                />
              ))}
              <MomentumMeter
                value={meters.momentum}
                onChange={(value) =>
                  setMeters((current) => ({ ...current, momentum: value }))
                }
                onBurn={() =>
                  setMeters((current) => ({ ...current, momentum: 2 }))
                }
              />
            </Flex>
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading title="Impacts" as="h3" variant="band" />
            <ImpactsSummary
              groups={impactGroups}
              value={impacts}
              onImpactChange={(key, marked) =>
                setImpacts((current) => ({ ...current, [key]: marked }))
              }
            />
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading title="Legacy Tracks" as="h3" variant="band" />
            {legacyTracks.map((track) => (
              <ProgressTrack
                key={track.key}
                label={track.label}
                ticks={track.ticks}
                legacy
              />
            ))}
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading title="Experience" as="h3" variant="band" />
            <XPMeter label="Unspent Experience" value={xp} onChange={setXp} />
          </Stack>
        </Stack>
      </TabPanel>

      <TabPanel value="assets" className={sheetPanelStyles}>
        <Stack gap="3">
          <Flex justifyContent="space-between" alignItems="center" gap="2">
            <Checkbox label="Show all abilities" size="sm" />
            <Button size="sm" startIcon={<PlusIcon />}>
              Add Assets
            </Button>
          </Flex>
          <AssetCard
            asset={sampleAssets.starship}
            state={{ controlValues: { integrity: 4 } }}
            headingAs="h3"
          />
          <AssetCard asset={sampleAssets.ace} headingAs="h3" />
          <AssetCard asset={sampleAssets.navigator} headingAs="h3" />
        </Stack>
      </TabPanel>

      <TabPanel value="tracks" className={sheetPanelStyles}>
        <TracksPanelDemo />
      </TabPanel>
    </Tabs>
  );
}

/* ------------------------------------------------------------------------ */
/* Notes                                                                    */
/* ------------------------------------------------------------------------ */

const openNotes = [
  { id: "session-4", label: "Session 4: The Drowned Archive" },
  { id: "vows", label: "Kira's Vows" },
  { id: "salvagers", label: "The Salvagers" },
];

/** The note's toolbar, inset like the other columns' contents. */
const noteToolbarStyles = css({
  paddingInline: "4",
  paddingBlockStart: "3",
});

const noteBodyStyles = css({
  boxSizing: "border-box",
  maxWidth: "72ch",
  paddingInline: "4",
  paddingBlock: "5",
  marginInline: "auto",
});

const logTabId = "game-log";

/** The log fills its notes tab, its entries kept to a readable width. */
const logNotePanelStyles = css({
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  "&[hidden]": { display: "none" },
});

/**
 * The open notes as tabs, each with its toolbar, as in the live app. With
 * `pinLog`, the game log is a pinned first tab: always open, never closed,
 * and counting what arrived while another note was open.
 */
export function NotesColumn(props: { pinLog?: boolean }) {
  const { pinLog } = props;
  const [notes, setNotes] = useState(openNotes);
  const [value, setValue] = useState<string | null>("session-4");
  // Two rolls arrived while the session note was open.
  const [unread, setUnread] = useState(2);
  const select = (id: string) => {
    setValue(id);
    if (id === logTabId) setUnread(0);
  };
  const tabs = pinLog
    ? [
        {
          id: logTabId,
          label: "Game Log",
          icon: <ChatsCircleIcon aria-hidden />,
          pinned: true,
          unread,
        },
        ...notes,
      ]
    : notes;
  const close = (id: string) => {
    const index = notes.findIndex((note) => note.id === id);
    const next = notes.filter((note) => note.id !== id);
    setNotes(next);
    if (id === value) {
      setValue(
        next[Math.min(index, next.length - 1)]?.id ??
          (pinLog ? logTabId : null),
      );
    }
  };
  return (
    <NoteTabs
      tabs={tabs}
      value={value}
      onValueChange={select}
      onClose={close}
      onAdd={() => {}}
      className={css({ height: "100%" })}
    >
      {notes.map((note) => (
        <NoteTabPanel key={note.id} value={note.id}>
          <div className={noteToolbarStyles}>
            <ActionToolbar
              label="Note Actions"
              breadcrumbs={
                <Breadcrumbs>
                  <BreadcrumbItem href="#notes">Notes</BreadcrumbItem>
                  <BreadcrumbItem href="#sessions">Sessions</BreadcrumbItem>
                  <BreadcrumbItem current>{note.label}</BreadcrumbItem>
                </Breadcrumbs>
              }
            >
              <ActionToolbarIconButton label="Share Note">
                <ShareNetworkIcon />
              </ActionToolbarIconButton>
              <ActionToolbarIconButton label="More Note Actions">
                <DotsThreeIcon weight="bold" />
              </ActionToolbarIconButton>
            </ActionToolbar>
          </div>
          <Stack gap="3" className={noteBodyStyles}>
            <Text variant="h3" as="h3">
              {note.label}
            </Text>
            <Text>
              Kira and Orrin reached the archive at low tide. The lower stacks
              were already under water, and something had dragged the shelves
              into a barricade across the reading room.
            </Text>
            <Text>
              Orrin swore an iron vow to recover the starchart before the next
              flood. Kira is less sure it is still there: the salvager they met
              at the dock was carrying a tube of the same stamped leather.
            </Text>
            <Text>
              Open threads: who hired the salvager, why the archive keepers
              left, and what is moving under the water in the east wing.
            </Text>
          </Stack>
        </NoteTabPanel>
      ))}
      {pinLog && (
        <NoteTabPanel value={logTabId} className={logNotePanelStyles}>
          <GameLogPanel maxContentWidth="640px" />
        </NoteTabPanel>
      )}
      {tabs.length === 0 && (
        <Stack alignItems="center" gap="3" padding="8">
          <Text color="muted">No notes open.</Text>
        </Stack>
      )}
    </NoteTabs>
  );
}

/* ------------------------------------------------------------------------ */
/* Reference                                                                */
/* ------------------------------------------------------------------------ */

/** Categories open at first: one of each, so the rows show. */
const openReferenceIds = new Set([
  "move_category:starforged/adventure",
  "oracle_collection:starforged/core",
  "oracle_collection:starforged/planet",
]);

/** Moves, Oracles and Game Log behind tabs, the row pinned over each. */
const referenceTabsStyles = css({
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

const referencePanelStyles = css({
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  paddingInline: "4",
  paddingBlockEnd: "6",
  "&[hidden]": { display: "none" },
});

const logPanelStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
  "&[hidden]": { display: "none" },
});

/** The game log with its sample entries, sending as the first character. */
function GameLogPanel(props: { maxContentWidth?: string }) {
  const [entries, setEntries] = useState<GameLogEntry[]>(gameLogEntries);
  return (
    <GameLog
      entries={entries}
      maxContentWidth={props.maxContentWidth}
      onSend={(message) =>
        setEntries((current) => [
          ...current,
          {
            kind: "message",
            id: `message-${current.length}`,
            author: characterAuthor(sampleCharacters[0], true),
            timestamp: new Date(),
            message,
          },
        ])
      }
    />
  );
}

/**
 * The reference: Moves, Oracles and the Game Log, as in the live app.
 * `showLog={false}` drops the log tab, for when the notes pin it.
 */
export function ReferenceColumn(
  props: { showLog?: boolean } & ColumnTabsProps,
) {
  const {
    showLog = true,
    tabsVariant = "well",
    section,
    onSectionChange,
  } = props;
  return (
    <Tabs
      defaultValue="moves"
      value={section}
      onValueChange={(value) => onSectionChange?.(String(value))}
      className={referenceTabsStyles}
    >
      <div className={tabRowStyles({ variant: tabsVariant })}>
        <SectionTabList
          aria-label="Reference Sections"
          variant={tabsVariant}
          fullWidth={tabsVariant !== "accent" && tabsVariant !== "pills"}
        >
          {getReferenceSections(showLog).map((tab) => (
            <SectionTab key={tab.id} value={tab.id}>
              {tab.title}
            </SectionTab>
          ))}
        </SectionTabList>
      </div>
      <TabPanel value="moves" className={referencePanelStyles}>
        <Stack gap="2">
          {starforgedMoveCategories.map((category) => (
            <MoveCategoryTree
              key={category._id}
              category={category}
              openIds={openReferenceIds}
            />
          ))}
        </Stack>
      </TabPanel>
      <TabPanel value="oracles" className={referencePanelStyles}>
        <Stack gap="2">
          {starforgedOracleCollections.map((collection) => (
            <OracleCollectionTree
              key={collection._id}
              collection={collection}
              openIds={openReferenceIds}
            />
          ))}
        </Stack>
      </TabPanel>
      {showLog && (
        <TabPanel value="log" className={logPanelStyles}>
          <Box
            flex="1 1 auto"
            minHeight="0"
            display="flex"
            flexDirection="column"
          >
            <GameLogPanel />
          </Box>
        </TabPanel>
      )}
    </Tabs>
  );
}
