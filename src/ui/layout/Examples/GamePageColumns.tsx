/**
 * The game page's three columns, built from the library and arranged as the
 * live app arranges them. Story-only: the GamePage, GameLayout and Playing a
 * game stories use these.
 *
 * - Character (live `CharacterSidebarContents`): the column's h2 with the
 *   character's menu, then Overview, Assets and Tracks tabs. Overview holds
 *   the details, Stats, Meters, Impacts, Legacy Tracks and Experience, in
 *   that order; Assets the asset cards; Tracks the vows, journeys, fights,
 *   clocks and connections.
 * - Notes (live `NotesSection`): the open notes as tabs, its h2 for screen
 *   readers only.
 * - Reference (live `ReferenceSidebarContents`): Moves, Oracles and Game
 *   Log tabs, each scrolling under the pinned tab row.
 */
import type { Datasworn } from "@datasworn-community/core";
import {
  DotsThreeIcon,
  GearSixIcon,
  PlusIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { useState } from "react";

import { css } from "styled-system/css";
import { Box, Flex, HStack, Stack } from "styled-system/jsx";

import { BreadcrumbItem, Breadcrumbs } from "../../components/Breadcrumbs";
import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { IconButton } from "../../components/IconButton";
import {
  NoteTabPanel,
  NoteTabs,
  SectionTab,
  SectionTabList,
  TabPanel,
  Tabs,
} from "../../components/Tabs";
import { Text } from "../../components/Text";
import { characterAuthor, gameLogEntries } from "../../examples/sampleLog";
import { AssetCard } from "../../game/AssetCard";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import { Clock } from "../../game/Clock";
import { ConditionMeter, MomentumMeter } from "../../game/ConditionMeter";
import { GameLog } from "../../game/GameLog";
import type { GameLogEntry } from "../../game/GameLog";
import { ImpactsChecklist } from "../../game/ImpactsChecklist";
import type { ImpactGroup } from "../../game/ImpactsChecklist";
import { InitiativeChip } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { MoveListItem } from "../../game/MoveListItem";
import { OracleListItem } from "../../game/OracleListItem";
import { ProgressTrack } from "../../game/ProgressTrack";
import { StatGrid } from "../../game/StatCard";
import { XPMeter } from "../../game/XPTrack";
import {
  SampleCharacter,
  sampleCharacters,
} from "../../stories/fixtures/characters";
import {
  sampleAssets,
  starforgedRules,
} from "../../stories/fixtures/datasworn";
import { ActionToolbar, ActionToolbarIconButton } from "../ActionToolbar";
import { SectionHeading } from "../SectionHeading";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** Tabs at the top of a column, with the panels under them. */
const columnTabsStyles = css({
  display: "flex",
  flexDirection: "column",
  minHeight: "100%",
});

const tabRowStyles = css({
  flex: "none",
  paddingInline: "4",
  paddingBlock: "3",
});

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

/** The character column's menu, as in the live column header. */
export function CharacterColumnActions() {
  return (
    <IconButton label="Character Settings" size="sm" tooltipSide="bottom">
      <GearSixIcon />
    </IconButton>
  );
}

/** The character sheet: Overview, Assets and Tracks, as in the live app. */
export function CharacterColumn(props: { character?: SampleCharacter }) {
  const { character = sampleCharacters[0] } = props;
  const [meters, setMeters] = useState(character.meters);
  const [initiative, setInitiative] = useState<InitiativeStatus>("outOfCombat");
  const [impacts, setImpacts] = useState<Record<string, boolean>>({
    wounded: true,
  });
  const [xp, setXp] = useState(4);
  const [vowTicks, setVowTicks] = useState(12);
  const [journeyTicks, setJourneyTicks] = useState(16);
  const [clock, setClock] = useState(2);
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <Tabs defaultValue="overview" className={columnTabsStyles}>
      <div className={tabRowStyles}>
        <SectionTabList aria-label="Character Sections">
          <SectionTab value="overview">Overview</SectionTab>
          <SectionTab value="assets">Assets</SectionTab>
          <SectionTab value="tracks">Tracks</SectionTab>
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

          <Stack gap="2" as="section">
            <SectionHeading title="Stats" as="h3" variant="band" />
            <StatGrid
              stats={statKeys.map((key) => ({
                key,
                name: capitalize(key),
                value: character.stats[key],
              }))}
              onRoll={() => {}}
            />
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
                  onChange={(value) =>
                    setMeters((current) => ({ ...current, [meter]: value }))
                  }
                  onRoll={() => {}}
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
            <ImpactsChecklist
              groups={impactGroups}
              value={impacts}
              onChange={(key, marked) =>
                setImpacts((current) => ({ ...current, [key]: marked }))
              }
              hideTitle
              size="sm"
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
        <Stack gap="3">
          <Flex justifyContent="space-between" alignItems="center" gap="2">
            <Checkbox
              label="Show Completed"
              size="sm"
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
            <Button size="sm" startIcon={<PlusIcon />}>
              Add Track
            </Button>
          </Flex>
          <ProgressTrack
            label="Recover the Hollow Crown"
            typeLabel="Vow"
            rank="formidable"
            ticks={vowTicks}
            onChange={setVowTicks}
          />
          <ProgressTrack
            label="Cross the Shattered Reach to Bleakhold"
            typeLabel="Journey"
            rank="dangerous"
            ticks={journeyTicks}
            onChange={setJourneyTicks}
          />
          <ProgressTrack
            label="Drive off the salvagers at the Drowned Archive"
            typeLabel="Combat"
            rank="troublesome"
            ticks={20}
          />
          <Clock
            label="The archive floods"
            segments={6}
            value={clock}
            onChange={setClock}
          />
          {showCompleted && (
            <ProgressTrack
              label="Find the missing courier"
              typeLabel="Vow"
              rank="dangerous"
              ticks={40}
              completed
            />
          )}
          <Stack gap="2" as="section" paddingBlockStart="3">
            <SectionHeading title="Connections" as="h3" variant="band" />
            <ProgressTrack
              label="Sera Kade, dock salvager"
              typeLabel="Connection"
              rank="troublesome"
              ticks={9}
            />
          </Stack>
        </Stack>
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

const noteBodyStyles = css({
  boxSizing: "border-box",
  maxWidth: "72ch",
  paddingInline: "6",
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

type LooseCategory = {
  name: string;
  contents: Record<string, Datasworn.AnyMove>;
};
const moveCategories = (["adventure", "quest", "combat"] as const).map(
  (key) => starforgedRules.moves[key] as LooseCategory,
);

type LooseOracle = Datasworn.OracleRollable;
const coreOracles = Object.values(
  starforgedRules.oracles.core.contents as Record<string, LooseOracle>,
);
const characterOracles = Object.values(
  (starforgedRules.oracles.character.contents ?? {}) as Record<
    string,
    LooseOracle
  >,
);

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

/** The reference: Moves, Oracles and the Game Log, as in the live app. */
export function ReferenceColumn() {
  const [entries, setEntries] = useState<GameLogEntry[]>(gameLogEntries);
  return (
    <Tabs defaultValue="moves" className={referenceTabsStyles}>
      <div className={tabRowStyles}>
        <SectionTabList aria-label="Reference Sections">
          <SectionTab value="moves">Moves</SectionTab>
          <SectionTab value="oracles">Oracles</SectionTab>
          <SectionTab value="log">Game Log</SectionTab>
        </SectionTabList>
      </div>
      <TabPanel value="moves" className={referencePanelStyles}>
        <Stack gap="5">
          {moveCategories.map((category) => (
            <Stack key={category.name} gap="1" as="section">
              <SectionHeading title={category.name} as="h3" variant="band" />
              {Object.values(category.contents).map((move) => (
                <MoveListItem key={move._id} move={move} />
              ))}
            </Stack>
          ))}
        </Stack>
      </TabPanel>
      <TabPanel value="oracles" className={referencePanelStyles}>
        <Stack gap="5">
          <Stack gap="1" as="section">
            <SectionHeading title="Core Oracles" as="h3" variant="band" />
            {coreOracles.map((oracle) => (
              <OracleListItem
                key={oracle._id}
                name={oracle.name}
                onRoll={() => {}}
              />
            ))}
          </Stack>
          {characterOracles.length > 0 && (
            <Stack gap="1" as="section">
              <SectionHeading
                title="Character Oracles"
                as="h3"
                variant="band"
              />
              {characterOracles.slice(0, 6).map((oracle) => (
                <OracleListItem
                  key={oracle._id}
                  name={oracle.name}
                  onRoll={() => {}}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </TabPanel>
      <TabPanel value="log" className={logPanelStyles}>
        <Box
          flex="1 1 auto"
          minHeight="0"
          display="flex"
          flexDirection="column"
        >
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
        </Box>
      </TabPanel>
    </Tabs>
  );
}
