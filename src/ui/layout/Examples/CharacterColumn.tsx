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
import { PlusIcon, UserIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Flex, HStack, Stack } from "ui/primitives";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { TabPanel, Tabs } from "../../components/Tabs";
import { Text } from "../../components/Text";
import { VisuallyHidden } from "../../components/VisuallyHidden";
import {
  SampleCharacter,
  sampleCharacters,
} from "../../docs/fixtures/characters";
import { sampleAssets, starforgedRules } from "../../docs/fixtures/datasworn";
import { AssetCard } from "../../game/AssetCard";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import {
  AddsControl,
  ConditionMeter,
  MomentumMeter,
} from "../../game/ConditionMeter";
import { XPMeter } from "../../game/ConditionMeter";
import type { ImpactGroup } from "../../game/ImpactsChecklist";
import { ImpactsSummary } from "../../game/ImpactsSummary";
import { InitiativeChip } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { ProgressTrack } from "../../game/ProgressTrack";
import { StatGrid } from "../../game/StatCard";
import { TracksPanelDemo } from "../../game/TracksPanel/TracksPanelDemo";
import { SectionHeading } from "../SectionHeading";
import { ColumnTabList } from "./ColumnTabList";
import { characterSections } from "./columnSections";
import {
  ColumnTabsProps,
  columnTabsStyles,
  sheetPanelStyles,
} from "./gamePageColumnShared";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

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
            <Stack gap="1" minWidth="0" alignItems="start">
              <Stack gap="0">
                <Text variant="h3" as="h3">
                  {character.name}
                </Text>
                {/* The player, under the name; "Played by" is read, not shown. */}
                <HStack gap="1" color="fg.muted">
                  <UserIcon aria-hidden />
                  <Text variant="caption" color="muted">
                    <VisuallyHidden>Played by </VisuallyHidden>
                    {character.playerName}
                  </Text>
                </HStack>
              </Stack>
              <InitiativeChip
                status={initiative}
                onStatusChange={setInitiative}
              />
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
            {/* At its own width, like the meters, not across the column. */}
            <Flex>
              <XPMeter label="Unspent Experience" value={xp} onChange={setXp} />
            </Flex>
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
