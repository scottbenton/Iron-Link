import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Flex, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import {
  SectionTab,
  SectionTabList,
  TabPanel,
  Tabs,
} from "../../components/Tabs";
import { SegmentedControl } from "../../components/ToggleGroup";
import { sampleCharacters } from "../../docs/fixtures/characters";
import {
  classicRules,
  sampleAssets,
  starforgedRules,
} from "../../docs/fixtures/datasworn";
import { AssetCard } from "../../game/AssetCard";
import {
  AddsControl,
  ConditionMeter,
  MomentumMeter,
} from "../../game/ConditionMeter";
import { XPMeter } from "../../game/ConditionMeter";
import type { ImpactGroup } from "../../game/ImpactsChecklist";
import { ImpactsSummary } from "../../game/ImpactsSummary";
import { getInitiativeOptions } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { ProgressTrack } from "../../game/ProgressTrack";
import type { RollData } from "../../game/RollCard";
import { StatGrid } from "../../game/StatCard";
import { TracksPanelDemo } from "../../game/TracksPanel/TracksPanelDemo";
import {
  classicCompletionMoves,
  classicTracks,
  sampleBonds,
} from "../../game/TracksPanel/tracksPanelSamples";
import { SectionHeading } from "../SectionHeading";
import { PhoneRuleset } from "./phoneGameScreens";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/* ------------------------------------------------------------------------ */
/* Rules data                                                               */
/* ------------------------------------------------------------------------ */

type LooseImpacts = Record<
  string,
  { label: string; contents: Record<string, { label: string }> }
>;

function getImpactGroups(ruleset: PhoneRuleset): ImpactGroup[] {
  const rules = ruleset === "ironsworn" ? classicRules : starforgedRules;
  return Object.entries(rules.rules.impacts as LooseImpacts).map(
    ([key, group]) => ({
      key,
      label: group.label,
      impacts: Object.entries(group.contents).map(([impactKey, impact]) => ({
        key: impactKey,
        label: impact.label,
      })),
    }),
  );
}

/* ------------------------------------------------------------------------ */
/* Sheet                                                                    */
/* ------------------------------------------------------------------------ */

const statKeys = ["edge", "heart", "iron", "shadow", "wits"] as const;

const meterKeys = ["health", "spirit", "supply"] as const;

/** The 48px tabs, sharing the width as the live phone tabs do. */
const screenTabsStyles = css({
  paddingInline: "4",
  paddingBlockStart: "1",
  "& [role=tablist]": { width: "100%" },
  // Equal shares of the row; doubled to outrank the tab's own `flex`.
  "& [role=tab][role=tab]": { flex: "1 1 0" },
});

const screenPanelStyles = css({
  paddingInline: "4",
  paddingBlockStart: "4",
  // Clear of the roll dock when rolls are showing.
  paddingBlockEnd: "var(--phone-page-foot, token(spacing.8))",
});

/** Meters two to a row, as on the live phone sheet. */
const meterGridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2",
});

export function SheetScreen(props: {
  ruleset: PhoneRuleset;
  onRoll: (roll: RollData) => void;
}) {
  const { ruleset, onRoll } = props;
  const character = sampleCharacters[0];
  const [meters, setMeters] = useState(character.meters);
  const [adds, setAdds] = useState(0);
  const [initiative, setInitiative] = useState<InitiativeStatus>("outOfCombat");
  const [impacts, setImpacts] = useState<Record<string, boolean>>({
    wounded: true,
  });
  const [xp, setXp] = useState(4);
  const impactGroups = getImpactGroups(ruleset);

  const roll = (statName: string, statValue: number) => {
    const actionDie = 4;
    const actionScore = Math.min(10, actionDie + statValue + adds);
    onRoll({
      kind: "action",
      moveName: "Face Danger",
      statName,
      statValue,
      adds: adds || undefined,
      actionDie,
      actionScore,
      challengeDice: [3, 8],
      outcome: actionScore > 8 ? "strongHit" : "weakHit",
    });
    setAdds(0);
  };

  return (
    <Tabs defaultValue="overview">
      <div className={screenTabsStyles}>
        <SectionTabList
          aria-label="Character Sections"
          variant="underline"
          size="lg"
        >
          <SectionTab value="overview">Overview</SectionTab>
          <SectionTab value="assets">Assets</SectionTab>
          <SectionTab value="tracks">Tracks</SectionTab>
        </SectionTabList>
      </div>

      <TabPanel value="overview" className={screenPanelStyles}>
        <Stack gap="6">
          {/* The portrait and name are in the top bar, so the sheet opens
              on initiative. */}
          <SegmentedControl<InitiativeStatus>
            aria-label="Initiative"
            fullWidth
            options={getInitiativeOptions(
              ruleset === "ironsworn" ? "ironsworn" : "starforged",
            )}
            value={initiative}
            onValueChange={setInitiative}
          />

          {/* Adds sit above the stats: they change whichever stat or meter
              the next roll uses. */}
          <Stack gap="3">
            <AddsControl value={adds} onChange={setAdds} stepperSize="touch" />
            <Stack gap="2" as="section">
              <SectionHeading title="Stats" as="h3" />
              <StatGrid
                stats={statKeys.map((key) => ({
                  key,
                  name: capitalize(key),
                  value: character.stats[key],
                }))}
                adds={adds}
                onRoll={(stat) => roll(stat.name, stat.value)}
              />
            </Stack>
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading title="Meters" as="h3" />
            <div className={meterGridStyles}>
              {meterKeys.map((meter) => (
                <ConditionMeter
                  key={meter}
                  label={capitalize(meter)}
                  value={meters[meter]}
                  max={5}
                  warnAtMin
                  adds={adds}
                  stepperSize="touch"
                  onChange={(value) =>
                    setMeters((current) => ({ ...current, [meter]: value }))
                  }
                  onRoll={() => roll(capitalize(meter), meters[meter])}
                />
              ))}
              <MomentumMeter
                value={meters.momentum}
                stepperSize="touch"
                onChange={(value) =>
                  setMeters((current) => ({ ...current, momentum: value }))
                }
                onBurn={() =>
                  setMeters((current) => ({ ...current, momentum: 2 }))
                }
              />
            </div>
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading
              title={ruleset === "ironsworn" ? "Debilities" : "Impacts"}
              as="h3"
            />
            <ImpactsSummary
              groups={impactGroups}
              value={impacts}
              onImpactChange={(key, marked) =>
                setImpacts((current) => ({ ...current, [key]: marked }))
              }
              wording={ruleset === "ironsworn" ? "ironsworn" : "starforged"}
            />
          </Stack>

          {ruleset === "starforged" && (
            <Stack gap="2" as="section">
              <SectionHeading title="Legacy Tracks" as="h3" />
              <ProgressTrack label="Quests" ticks={14} legacy />
              <ProgressTrack label="Bonds" ticks={6} legacy />
              <ProgressTrack label="Discoveries" ticks={9} legacy />
            </Stack>
          )}

          <Stack gap="2" as="section">
            <SectionHeading title="Experience" as="h3" />
            <XPMeter label="Unspent Experience" value={xp} onChange={setXp} />
          </Stack>
        </Stack>
      </TabPanel>

      <TabPanel value="assets" className={screenPanelStyles}>
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
        </Stack>
      </TabPanel>

      <TabPanel value="tracks" className={screenPanelStyles}>
        {ruleset === "ironsworn" ? (
          <TracksPanelDemo
            initialTracks={classicTracks}
            initialConnections={null}
            initialBonds={sampleBonds}
            completionMoves={classicCompletionMoves}
            addKinds={["vow", "journey", "combat", "clock"]}
          />
        ) : (
          <TracksPanelDemo />
        )}
      </TabPanel>
    </Tabs>
  );
}
