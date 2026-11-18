import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode, useState } from "react";
import { fn } from "storybook/test";

import { Box, HStack, Stack } from "ui/primitives";

import { Button } from "../../components/Button";
import { TrackDialog } from "./TrackDialog";
import { TracksPanel } from "./TracksPanel";
import { TracksPanelDemo } from "./TracksPanelDemo";
import {
  classicCompletionMoves,
  classicTracks,
  manySampleTracks,
  sampleBonds,
  sampleConnections,
  sampleTracks,
  starforgedCompletionMoves,
} from "./tracksPanelSamples";
import type { TrackKind } from "./tracksPanelTypes";

/** The character column's width at its default, on the sheet's surface. */
function Column(props: { width?: number; children: ReactNode }) {
  const { width = 380, children } = props;
  return (
    <Box
      width={`${width}px`}
      maxWidth="100%"
      padding="4"
      background="bg.surface"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="border.default"
      borderRadius="lg"
    >
      {children}
    </Box>
  );
}

const meta = {
  title: "Game/TracksPanel",
  component: TracksPanel,
  args: { tracks: sampleTracks },
  parameters: { layout: "padded" },
} satisfies Meta<typeof TracksPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every control the live Tracks tab has, in the new style and all live:
 *
 * - **Show Completed** and **Add Track** (Vow, Journey, Combat, Scene
 *   Challenge, Clock), which opens TrackDialog.
 * - Each track: minus and plus by its rank, and its completion roll (Fulfill
 *   Your Vow, Finish an Expedition, Take Decisive Action, Finish the Scene)
 *   under the boxes. A scene challenge adds its tension clock.
 * - Each clock: minus and plus, its odds and **Roll Progress**, which asks
 *   the oracle (a real d100 here) and advances it on a Yes, two on a match.
 * - The ⋯ menu: Edit, Complete or Reopen, Open on Second Screen and Delete
 *   (which asks first). Complete a track to watch it leave the list.
 * - **Connections**: Show Bonded and Add, then each connection's track,
 *   Forge a Bond and Bonded, with sharing, removal and rank in its menu.
 *   The section starts closed with three or more.
 */
export const Everything: Story = {
  name: "Tracks tab, everything",
  render: () => (
    <Column>
      <TracksPanelDemo />
    </Column>
  ),
};

/** The same panel at the sidebar's narrowest, a middle width and wide. */
export const Widths: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start" flexWrap="wrap">
      {[280, 360, 480].map((width) => (
        <Stack key={width} gap="2">
          <Box fontSize="xs" color="fg.muted">
            {width}px column
          </Box>
          <Column width={width}>
            <TracksPanelDemo initialConnections={null} />
          </Column>
        </Stack>
      ))}
    </HStack>
  ),
};

/** Completed tracks shown: badges, no marking, Reopen in the menu. */
export const ShowingCompleted: Story = {
  render: () => (
    <Column>
      <TracksPanelDemo defaultShowCompleted />
    </Column>
  ),
};

/** Fourteen tracks of every kind. The Connections section starts closed. */
export const ManyTracks: Story = {
  render: () => (
    <Column>
      <TracksPanelDemo initialTracks={manySampleTracks} />
    </Column>
  ),
};

/**
 * A new game: no tracks and no connections, each with its own empty
 * state. Add Track still works.
 */
export const Empty: Story = {
  render: () => (
    <Column>
      <TracksPanelDemo initialTracks={[]} initialConnections={[]} />
    </Column>
  ),
};

/**
 * Every track completed, with Show Completed off; and every connection
 * bonded, with Show Bonded off.
 */
export const NothingActive: Story = {
  render: () => (
    <Column>
      <TracksPanelDemo
        initialTracks={sampleTracks.map((track) => ({
          ...track,
          completed: true,
        }))}
        initialConnections={sampleConnections.map((connection) => ({
          ...connection,
          bonded: true,
        }))}
      />
    </Column>
  ),
};

/**
 * A viewer's view: no Add, no minus or plus, no menus or rolls. Show
 * Completed and Show Bonded still filter.
 */
export const ReadOnly: Story = {
  render: () => (
    <Column>
      <TracksPanel
        tracks={sampleTracks}
        readOnly
        connections={sampleConnections}
        completionMoves={starforgedCompletionMoves}
      />
    </Column>
  ),
};

/**
 * Ironsworn: Bonds instead of Connections (each links to its entry and can
 * be cleared), no Scene Challenge in Add Track, and Ironsworn's moves.
 */
export const Ironsworn: Story = {
  render: () => (
    <Column>
      <TracksPanelDemo
        initialTracks={classicTracks}
        initialConnections={null}
        initialBonds={sampleBonds}
        completionMoves={classicCompletionMoves}
        addKinds={["vow", "journey", "combat", "clock"]}
        strings={{
          kindLabels: {
            vow: "Iron Vow",
            journey: "Journey",
            combat: "Combat",
            sceneChallenge: "Scene Challenge",
            clock: "Clock",
          },
        }}
      />
    </Column>
  ),
};

/** Wired to actions only, to check the callbacks in the Actions panel. */
export const Callbacks: Story = {
  args: {
    tracks: sampleTracks,
    connections: sampleConnections,
    completionMoves: starforgedCompletionMoves,
    onAdd: fn(),
    onTicksChange: fn(),
    onClockChange: fn(),
    onRollMove: fn(),
    onRollClock: fn(),
    onOddsChange: fn(),
    onEdit: fn(),
    onCompletedChange: fn(),
    onDelete: fn(),
    onSecondScreenChange: fn(),
    onConnectionTicksChange: fn(),
    onConnectionBondedChange: fn(),
    onConnectionRankChange: fn(),
    onConnectionAction: fn(),
    onRollConnection: fn(),
    onAddConnection: fn(),
  },
  render: (args) => (
    <Column>
      <TracksPanel {...args} />
    </Column>
  ),
};

/**
 * TrackDialog on its own: adding each kind, and editing a vow (change its
 * rank to see Reset Progress). The title is required; Enter submits.
 */
export const Dialogs: Story = {
  render: function Render() {
    // Kind and edit stay set while it closes, so its text holds still.
    const [state, setState] = useState({
      open: false,
      kind: "vow" as TrackKind,
      edit: false,
      key: 0,
    });
    const show = (kind: TrackKind, edit = false) =>
      setState((current) => ({ open: true, kind, edit, key: current.key + 1 }));
    const close = () => setState((current) => ({ ...current, open: false }));
    return (
      <HStack gap="2" flexWrap="wrap">
        <Button size="sm" onClick={() => show("vow")}>
          Add Vow
        </Button>
        <Button size="sm" onClick={() => show("sceneChallenge")}>
          Add Scene Challenge
        </Button>
        <Button size="sm" onClick={() => show("clock")}>
          Add Clock
        </Button>
        <Button size="sm" onClick={() => show("vow", true)}>
          Edit Vow
        </Button>
        <Button size="sm" onClick={() => show("clock", true)}>
          Edit Clock
        </Button>
        <TrackDialog
          key={state.key}
          open={state.open}
          onClose={close}
          kind={state.kind}
          track={
            state.edit
              ? sampleTracks.find((track) =>
                  state.kind === "clock"
                    ? track.kind === "clock"
                    : track.kind === "vow",
                )
              : undefined
          }
          onSave={close}
        />
      </HStack>
    );
  },
};
