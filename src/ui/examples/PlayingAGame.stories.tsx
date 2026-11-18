import type { Datasworn } from "@datasworn-community/core";
import {
  BookOpenIcon,
  ChatCircleTextIcon,
  GearSixIcon,
  UserIcon,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useState } from "react";

import { Stack } from "styled-system/jsx";

import { IconButton } from "../components/IconButton";
import { SectionTab, SectionTabList, TabPanel, Tabs } from "../components/Tabs";
import { Text } from "../components/Text";
import { toast } from "../components/Toast";
import { AssetCard } from "../game/AssetCard";
import { ConditionMeter, MomentumMeter } from "../game/ConditionMeter";
import { GameLog } from "../game/GameLog";
import type { GameLogEntry } from "../game/GameLog";
import { getMoveRollOptions } from "../game/MoveCard";
import { MoveListItem } from "../game/MoveListItem";
import { OracleListItem } from "../game/OracleListItem";
import { ProgressTrack } from "../game/ProgressTrack";
import { RollCard, getRollSummary } from "../game/RollCard";
import type { RollData } from "../game/RollCard";
import { StatGrid } from "../game/StatCard";
import { AppShell, GameLayout, NavBar, NavRail } from "../layout";
import type { LayoutPanel } from "../layout";
import { GamePageTabs } from "../layout/Examples/StoryPlaceholders";
import { getNavItems } from "../layout/Examples/storyData";
import { sampleCharacters } from "../stories/fixtures/characters";
import {
  sampleAssets,
  sampleMoves,
  starforgedRules,
} from "../stories/fixtures/datasworn";
import { rollAction, rollOracle } from "./rollDice";
import { characterAuthor, gameLogEntries } from "./sampleLog";

const meta: Meta = {
  title: "Examples/Playing a game",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Everything together: roll a stat, a meter or a move and the result appears as a toast and in the log. Nothing here talks to a server.",
      },
    },
  },
};
export default meta;

const character = sampleCharacters[0];
const statKeys = ["edge", "heart", "iron", "shadow", "wits"] as const;
const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

const referenceMoves: Datasworn.AnyMove[] = [
  sampleMoves.faceDanger,
  sampleMoves.gatherInformation,
  sampleMoves.strike,
  sampleMoves.payThePrice,
];

type OracleRow = { min: number; max: number; text: string };
function oracleRows(oracle: Datasworn.OracleRollable): OracleRow[] {
  return (oracle.rows ?? []).map((row) => ({
    min: row.roll?.min ?? 0,
    max: row.roll?.max ?? 0,
    text: row.text,
  }));
}
const coreOracles = starforgedRules.oracles.core.contents as Record<
  string,
  Datasworn.OracleRollable
>;
const referenceOracles = ["action", "theme", "descriptor", "focus"]
  .map((key) => coreOracles[key])
  .filter(Boolean);

function PlayingAGame() {
  const [stats] = useState(character.stats);
  const [meters, setMeters] = useState(character.meters);
  const [vowTicks, setVowTicks] = useState(12);
  const [entries, setEntries] = useState<GameLogEntry[]>(gameLogEntries);
  const [width, setWidth] = useState(400);
  const [collapsed, setCollapsed] = useState(false);

  const showRoll = useCallback((roll: RollData) => {
    toast.custom(
      ({ dismiss }) => <RollCard roll={roll} elevated onDismiss={dismiss} />,
      { announcement: getRollSummary(roll) },
    );
    setEntries((current) => [
      ...current,
      {
        kind: "roll",
        id: `roll-${current.length}`,
        author: characterAuthor(character, true),
        timestamp: new Date(),
        roll,
      },
    ]);
  }, []);

  const characterPanel: LayoutPanel = {
    id: "character",
    title: "Character",
    icon: <UserIcon />,
    content: (
      <Stack gap="4" padding="4">
        <Tabs defaultValue="overview">
          <SectionTabList aria-label="Character sections">
            <SectionTab value="overview">Overview</SectionTab>
            <SectionTab value="assets">Assets</SectionTab>
            <SectionTab value="tracks">Tracks</SectionTab>
          </SectionTabList>
          <TabPanel value="overview">
            <Stack gap="4" paddingTop="3">
              <Stack gap="0.5">
                <Text variant="h3" as="p">
                  {character.name}
                </Text>
                <Text variant="bodySm" color="muted">
                  Played by {character.playerName}
                </Text>
              </Stack>
              <StatGrid
                stats={statKeys.map((key) => ({
                  key,
                  name: capitalize(key),
                  value: stats[key],
                }))}
                onRoll={(stat) => showRoll(rollAction(stat.name, stat.value))}
              />
              <Stack direction="row" gap="2" flexWrap="wrap">
                {(["health", "spirit", "supply"] as const).map((meter) => (
                  <ConditionMeter
                    key={meter}
                    label={capitalize(meter)}
                    value={meters[meter]}
                    max={5}
                    warnAtMin
                    onChange={(value) =>
                      setMeters((current) => ({ ...current, [meter]: value }))
                    }
                    onRoll={() =>
                      showRoll(rollAction(capitalize(meter), meters[meter]))
                    }
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
              </Stack>
            </Stack>
          </TabPanel>
          <TabPanel value="tracks">
            <Stack gap="3" paddingTop="3">
              <ProgressTrack
                label="Recover the Hollow Crown"
                typeLabel="Vow"
                rank="formidable"
                ticks={vowTicks}
                onChange={setVowTicks}
              />
              <ProgressTrack label="Quests" legacy ticks={18} />
            </Stack>
          </TabPanel>
          <TabPanel value="assets">
            <Stack gap="3" paddingTop="3">
              <AssetCard
                asset={sampleAssets.starship}
                state={{ controlValues: { integrity: 4 } }}
                collapsed
                headingAs="h3"
              />
              <AssetCard asset={sampleAssets.ace} collapsed headingAs="h3" />
            </Stack>
          </TabPanel>
        </Tabs>
      </Stack>
    ),
  };

  const referencePanel: LayoutPanel = {
    id: "reference",
    title: "Reference",
    icon: <BookOpenIcon />,
    content: (
      <Stack gap="4" padding="4">
        <Stack gap="1" as="section">
          <Text variant="h3">Moves</Text>
          {referenceMoves.map((move) => (
            <MoveListItem
              key={move._id}
              move={move}
              moveCardProps={{
                rollOptions: getMoveRollOptions(move).map((option) => ({
                  ...option,
                  value: stats[option.id as keyof typeof stats],
                })),
                onRoll: (option) =>
                  showRoll(
                    rollAction(option.label, option.value ?? 0, move.name),
                  ),
              }}
            />
          ))}
        </Stack>
        <Stack gap="1" as="section">
          <Text variant="h3">Core oracles</Text>
          {referenceOracles.map((oracle) => (
            <OracleListItem
              key={oracle._id}
              name={oracle.name}
              onRoll={() =>
                showRoll(
                  rollOracle(oracle.name, "Core Oracles", oracleRows(oracle)),
                )
              }
            />
          ))}
        </Stack>
      </Stack>
    ),
  };

  return (
    <AppShell
      fill
      rail={
        <NavRail
          items={getNavItems("games")}
          homeHref="#games"
          actions={
            <IconButton label="App Settings">
              <GearSixIcon />
            </IconButton>
          }
        />
      }
      topBar={<NavBar title="The Iron Expanse" items={getNavItems("games")} />}
    >
      <GameLayout
        tabs={<GamePageTabs current="kira" />}
        main={{
          id: "log",
          title: "Game Log",
          icon: <ChatCircleTextIcon />,
          content: (
            <GameLog
              entries={entries}
              onSend={(message) =>
                setEntries((current) => [
                  ...current,
                  {
                    kind: "message",
                    id: `message-${current.length}`,
                    author: characterAuthor(character, true),
                    timestamp: new Date(),
                    message,
                  },
                ])
              }
            />
          ),
        }}
        startSidebar={{
          panels: [characterPanel],
          width,
          onWidthChange: setWidth,
          collapsed,
          onCollapsedChange: setCollapsed,
        }}
        endSidebar={{ panels: [referencePanel], defaultWidth: 350 }}
      />
    </AppShell>
  );
}

/**
 * Roll a stat card, a meter, a move from the Reference tab or an oracle.
 * Each roll shows as a toast that stays until dismissed and lands in the
 * game log. Send a message from the log's composer.
 */
export const Desktop: StoryObj = {
  render: () => <PlayingAGame />,
};
