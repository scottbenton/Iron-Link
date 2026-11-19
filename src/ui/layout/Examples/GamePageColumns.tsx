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
 * - Game Overview (live `GameOverviewSheet`, in the character column's place
 *   on the Overview page): Characters, Assets and Tracks tabs. Characters
 *   holds the game's characters (`CharacterCard`) and Add Character, then
 *   its players (`PlayerCard`) and Copy Invite Link; Assets and Tracks are
 *   the game's own, shared by everyone.
 * - Notes (live `NotesSection`): the open notes as tabs, its h2 for screen
 *   readers only.
 * - Reference (live `ReferenceSidebarContents`): Moves, Oracles and Game
 *   Log tabs, each scrolling under the pinned tab row.
 */
import {
  ArrowSquareOutIcon,
  DotsThreeIcon,
  PlusIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { useState } from "react";

import { Box, Flex, HStack, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { BreadcrumbItem, Breadcrumbs } from "../../components/Breadcrumbs";
import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { CopyButton } from "../../components/CopyButton";
import {
  NoteTabPanel,
  NoteTabs,
  SectionTab,
  SectionTabList,
  SectionTabWell,
  TabPanel,
  Tabs,
} from "../../components/Tabs";
import { Text } from "../../components/Text";
import { characterAuthor, gameLogEntries } from "../../examples/sampleLog";
import { AssetCard } from "../../game/AssetCard";
import { CharacterCard } from "../../game/CharacterCard";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import {
  AddsControl,
  ConditionMeter,
  MomentumMeter,
} from "../../game/ConditionMeter";
import { XPMeter } from "../../game/ConditionMeter";
import { GameLog } from "../../game/GameLog";
import type { GameLogEntry } from "../../game/GameLog";
import type { ImpactGroup } from "../../game/ImpactsChecklist";
import { ImpactsSummary } from "../../game/ImpactsSummary";
import { InitiativeChip } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { PlayerCard } from "../../game/PlayerCard";
import { ProgressTrack } from "../../game/ProgressTrack";
import { StatGrid } from "../../game/StatCard";
import { TracksPanelDemo } from "../../game/TracksPanel/TracksPanelDemo";
import {
  SampleCharacter,
  sampleCharacters,
  samplePortraitSrc,
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
import { SidebarHeaderEnd } from "../Sidebar";
import type { LayoutSection } from "../shared/layoutPanel";
import {
  characterSections,
  overviewSections,
  referenceSections,
} from "./columnSections";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** Tabs at the top of a column, with the panels under them. */
const columnTabsStyles = css({
  display: "flex",
  flexDirection: "column",
  minHeight: "100%",
});

/**
 * The row holding a column's tabs: a well edge to edge. It stays at the top
 * while the column scrolls, as the header did, so the tabs and (stacked)
 * Collapse never scroll away.
 */
const tabRowStyles = css({
  flex: "none",
  marginBlockEnd: "4",
  position: "sticky",
  top: 0,
  zIndex: 2,
});

/**
 * A column's tabs in a well. The band also takes the column header's
 * controls when the sidebars stack into one column (`SidebarHeaderEnd`), so
 * the stacked column has no title rows and the tabs are its top row.
 */
function ColumnTabList(props: { label: string; sections: LayoutSection[] }) {
  const { label, sections } = props;
  return (
    <div className={tabRowStyles}>
      <SectionTabWell end={<SidebarHeaderEnd />}>
        <SectionTabList aria-label={label}>
          {sections.map((tab) => (
            <SectionTab key={tab.id} value={tab.id}>
              {tab.title}
            </SectionTab>
          ))}
        </SectionTabList>
      </SectionTabWell>
    </div>
  );
}

/** Props the game page's columns share for their own tabs. */
export interface ColumnTabsProps {
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
  const { character = sampleCharacters[0], section, onSectionChange } = props;
  const [meters, setMeters] = useState(character.meters);
  // Adds apply to the next roll, then reset to 0, as the live app does.
  const [adds, setAdds] = useState(0);
  const rollWithAdds = () => setAdds(0);
  const [initiative, setInitiative] = useState<InitiativeStatus>("outOfCombat");
  const [impacts, setImpacts] = useState<Record<string, boolean>>({
    wounded: true,
  });
  const [xp, setXp] = useState(4);
  const [legacyTicks, setLegacyTicks] = useState<Record<string, number>>(() =>
    Object.fromEntries(legacyTracks.map((t) => [t.key, t.ticks])),
  );

  return (
    <Tabs
      defaultValue="overview"
      value={section}
      onValueChange={(value) => onSectionChange?.(String(value))}
      className={columnTabsStyles}
    >
      <ColumnTabList label="Character Sections" sections={characterSections} />

      <TabPanel value="overview" className={sheetPanelStyles}>
        <Stack gap="6">
          <HStack gap="3" alignItems="center">
            <CharacterPortrait
              name={character.name}
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
              <SectionHeading title="Stats" as="h3" />
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
            <SectionHeading title="Meters" as="h3" />
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
            <SectionHeading title="Impacts" as="h3" />
            <ImpactsSummary
              groups={impactGroups}
              value={impacts}
              onImpactChange={(key, marked) =>
                setImpacts((current) => ({ ...current, [key]: marked }))
              }
            />
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading title="Legacy Tracks" as="h3" />
            {legacyTracks.map((track) => (
              <ProgressTrack
                key={track.key}
                label={track.label}
                ticks={legacyTicks[track.key]}
                onChange={(ticks) =>
                  setLegacyTicks((current) => ({
                    ...current,
                    [track.key]: ticks,
                  }))
                }
                legacy
              />
            ))}
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading title="Experience" as="h3" />
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
/* Game overview                                                            */
/* ------------------------------------------------------------------------ */

/**
 * Cards in a column fill its width; where the column is wide enough (the
 * notes' width on a phone's tab, say) they sit two or more to a row.
 */
const cardGridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
  gap: "3",
  alignItems: "start",
});

const [kira, orrin, senna] = sampleCharacters;

/** The game's characters, each ringed in its own theme where it has one. */
const overviewCharacters = [
  { ...kira, portraitUrl: samplePortraitSrc, colorScheme: "cinder" as const },
  { ...orrin, colorScheme: "myriad" as const },
  { ...senna, colorScheme: undefined },
];

/**
 * Characters, then (not in solo games) Players, as the live
 * `CharactersAndUsersTab`. Scott is the Guide here, so he sees Make Guide
 * and Kick Player on the others and Leave Guide Role and Leave Game on his
 * own card.
 */
export function OverviewCharacters(props: { solo?: boolean }) {
  const { solo } = props;
  const [onScreen, setOnScreen] = useState<string | null>(kira.id);
  return (
    <Stack gap="6">
      <Stack gap="3" as="section">
        <SectionHeading title="Characters" as="h3" />
        <div className={cardGridStyles}>
          {(solo ? overviewCharacters.slice(0, 1) : overviewCharacters).map(
            (character) => (
              <CharacterCard
                key={character.id}
                name={character.name}
                playerName={solo ? undefined : character.playerName}
                portraitUrl={character.portraitUrl}
                colorScheme={character.colorScheme}
                headingAs="h4"
                render={<a href={`#${character.id}`} />}
                actions={
                  <Button
                    size="sm"
                    variant="ghost"
                    startIcon={<ArrowSquareOutIcon />}
                    onClick={() =>
                      setOnScreen((current) =>
                        current === character.id ? null : character.id,
                      )
                    }
                  >
                    {onScreen === character.id ? "On Screen" : "Open on Screen"}
                  </Button>
                }
              />
            ),
          )}
        </div>
        <HStack>
          <Button
            variant="outline"
            startIcon={<PlusIcon />}
            render={<a href="#create-character" />}
            nativeButton={false}
          >
            Add Character
          </Button>
        </HStack>
      </Stack>
      {!solo && (
        <Stack gap="3" as="section">
          <SectionHeading title="Players" as="h3" />
          <div className={cardGridStyles}>
            <PlayerCard
              name={kira.playerName}
              role="guide"
              isYou
              headingAs="h4"
              status="online"
              statusLabel="Online"
              characters={[
                { id: kira.id, name: kira.name, colorScheme: "cinder" },
              ]}
              actions={
                <>
                  <Button size="sm" variant="ghost">
                    Leave Guide Role
                  </Button>
                  <Button size="sm" variant="ghost">
                    Leave Game
                  </Button>
                </>
              }
            />
            <PlayerCard
              name={orrin.playerName}
              role="player"
              headingAs="h4"
              status="online"
              statusLabel="Online"
              characters={[
                { id: orrin.id, name: orrin.name, colorScheme: "myriad" },
              ]}
              actions={
                <>
                  <Button size="sm" variant="ghost">
                    Make Guide
                  </Button>
                  <Button size="sm" variant="ghost">
                    Kick Player
                  </Button>
                </>
              }
            />
            <PlayerCard
              name={senna.playerName}
              role="player"
              headingAs="h4"
              status="away"
              statusLabel="Away"
              characters={[{ id: senna.id, name: senna.name }]}
              actions={
                <>
                  <Button size="sm" variant="ghost">
                    Make Guide
                  </Button>
                  <Button size="sm" variant="ghost">
                    Kick Player
                  </Button>
                </>
              }
            />
          </div>
          <HStack>
            <CopyButton
              variant="outline"
              text="https://iron-link.app/join/drowned-archive"
              label="Copy Invite Link"
              copiedLabel="Invite Link Copied"
            />
          </HStack>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * The game overview: Characters, Assets and Tracks, as the live
 * `GameOverviewSheet`. It takes the character column's place on the game's
 * Overview page; its settings are the game's, in the rail's menu.
 */
export function OverviewColumn(props: { solo?: boolean } & ColumnTabsProps) {
  const { solo, section, onSectionChange } = props;
  return (
    <Tabs
      defaultValue="characters"
      value={section}
      onValueChange={(value) => onSectionChange?.(String(value))}
      className={columnTabsStyles}
    >
      <ColumnTabList
        label="Game Overview Sections"
        sections={overviewSections}
      />

      <TabPanel value="characters" className={sheetPanelStyles}>
        <OverviewCharacters solo={solo} />
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
            state={{ controlValues: { integrity: 5 } }}
            headingAs="h3"
          />
        </Stack>
      </TabPanel>

      <TabPanel value="tracks" className={sheetPanelStyles}>
        <TracksPanelDemo initialConnections={null} />
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
  maxWidth: "prose",
  paddingInline: "4",
  paddingBlock: "5",
  marginInline: "auto",
});

/** The open notes as tabs, each with its toolbar, as in the live app. */
export function NotesColumn() {
  const [notes, setNotes] = useState(openNotes);
  const [value, setValue] = useState<string | null>("session-4");
  const close = (id: string) => {
    const index = notes.findIndex((note) => note.id === id);
    const next = notes.filter((note) => note.id !== id);
    setNotes(next);
    if (id === value) {
      setValue(next[Math.min(index, next.length - 1)]?.id ?? null);
    }
  };
  return (
    <NoteTabs
      tabs={notes}
      value={value}
      onValueChange={setValue}
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
      {notes.length === 0 && (
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
function GameLogPanel() {
  const [entries, setEntries] = useState<GameLogEntry[]>(gameLogEntries);
  return (
    <GameLog
      entries={entries}
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

/** The reference: Moves, Oracles and the Game Log, as in the live app. */
export function ReferenceColumn(props: ColumnTabsProps) {
  const { section, onSectionChange } = props;
  return (
    <Tabs
      defaultValue="moves"
      value={section}
      onValueChange={(value) => onSectionChange?.(String(value))}
      className={referenceTabsStyles}
    >
      <ColumnTabList label="Reference Sections" sections={referenceSections} />
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
    </Tabs>
  );
}
