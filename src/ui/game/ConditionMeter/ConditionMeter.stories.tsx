import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Box, HStack, Stack } from "styled-system/jsx";

import { Text } from "../../components/Text";
import { sampleCharacters } from "../../stories/fixtures/characters";
import { StatGrid } from "../StatCard";
import { formatSigned } from "../shared/format";
import { AddsMeter } from "./AddsMeter";
import { ConditionMeter } from "./ConditionMeter";
import { MomentumMeter } from "./MomentumMeter";

const meta = {
  title: "Game/ConditionMeter",
  component: ConditionMeter,
  args: { label: "Health", value: 3, max: 5 },
} satisfies Meta<typeof ConditionMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <ConditionMeter {...args} value={value} onChange={setValue} />;
  },
};

function CharacterMeters(props: { index: number; readOnly?: boolean }) {
  const character = sampleCharacters[props.index];
  const [meters, setMeters] = useState(character.meters);
  const set = (key: keyof typeof meters) =>
    props.readOnly
      ? undefined
      : (value: number) => setMeters((m) => ({ ...m, [key]: value }));
  return (
    <Stack gap="2">
      <span>{character.name}</span>
      <HStack gap="2" alignItems="stretch" flexWrap="wrap">
        <ConditionMeter
          label="Health"
          value={meters.health}
          max={5}
          warnAtMin
          onChange={set("health")}
          onRoll={props.readOnly ? undefined : fn()}
        />
        <ConditionMeter
          label="Spirit"
          value={meters.spirit}
          max={5}
          warnAtMin
          onChange={set("spirit")}
          onRoll={props.readOnly ? undefined : fn()}
        />
        <ConditionMeter
          label="Supply"
          value={meters.supply}
          max={5}
          warnAtMin
          onChange={set("supply")}
          onRoll={props.readOnly ? undefined : fn()}
        />
        <MomentumMeter
          value={meters.momentum}
          onChange={set("momentum")}
          onBurn={props.readOnly ? undefined : fn()}
        />
      </HStack>
    </Stack>
  );
}

export const CharacterSheet: Story = {
  render: () => (
    <Stack gap="6">
      <CharacterMeters index={0} />
      <CharacterMeters index={2} />
    </Stack>
  ),
};

export const ReadOnly: Story = {
  render: () => <CharacterMeters index={1} readOnly />,
};

export const Maxed: Story = {
  render: () => (
    <HStack gap="2" alignItems="stretch" flexWrap="wrap">
      <ConditionMeter label="Health" value={5} max={5} onChange={fn()} />
      <ConditionMeter label="Spirit" value={5} max={5} onChange={fn()} />
      <MomentumMeter value={10} onChange={fn()} onBurn={fn()} />
    </HStack>
  ),
};

export const AtZero: Story = {
  render: () => (
    <HStack gap="2" alignItems="stretch" flexWrap="wrap">
      <ConditionMeter
        label="Health"
        value={0}
        max={5}
        warnAtMin
        onChange={fn()}
      />
      <ConditionMeter
        label="Supply"
        value={0}
        max={5}
        warnAtMin
        onChange={fn()}
      />
    </HStack>
  ),
};

export const NegativeMomentum: Story = {
  render: () => (
    <HStack gap="2" alignItems="stretch" flexWrap="wrap">
      <MomentumMeter value={-2} onChange={fn()} onBurn={fn()} />
      <MomentumMeter value={-6} onChange={fn()} onBurn={fn()} />
    </HStack>
  ),
};

export const MomentumWithImpacts: Story = {
  name: "Momentum with two impacts",
  render: function Render() {
    const [value, setValue] = useState(8);
    return (
      <MomentumMeter
        value={value}
        onChange={setValue}
        onBurn={() => setValue(0)}
        max={8}
        resetValue={0}
      />
    );
  },
};

/**
 * Momentum is the same height as the meters beside it: Burn and Reset live in
 * the menu its value opens, headed by its max and reset. Aligned to the top,
 * not stretched, so any height difference would show.
 */
export const MomentumBesideMeters: Story = {
  render: function Render() {
    const [meters, setMeters] = useState({
      health: 4,
      spirit: 3,
      supply: 2,
      momentum: 6,
    });
    const set = (key: keyof typeof meters) => (value: number) =>
      setMeters((m) => ({ ...m, [key]: value }));
    return (
      <Stack gap="4">
        <HStack gap="2" alignItems="flex-start" flexWrap="wrap">
          <ConditionMeter
            label="Health"
            value={meters.health}
            max={5}
            warnAtMin
            onChange={set("health")}
            onRoll={fn()}
          />
          <ConditionMeter
            label="Spirit"
            value={meters.spirit}
            max={5}
            warnAtMin
            onChange={set("spirit")}
            onRoll={fn()}
          />
          <ConditionMeter
            label="Supply"
            value={meters.supply}
            max={5}
            warnAtMin
            onChange={set("supply")}
            onRoll={fn()}
          />
          <MomentumMeter
            value={meters.momentum}
            onChange={set("momentum")}
            onBurn={() => setMeters((m) => ({ ...m, momentum: 2 }))}
          />
        </HStack>
        <HStack gap="2" alignItems="flex-start" flexWrap="wrap">
          <ConditionMeter label="Health" value={1} max={5} onChange={fn()} />
          <MomentumMeter value={-3} onChange={fn()} onBurn={fn()} />
          <MomentumMeter value={10} onChange={fn()} onBurn={fn()} />
          <MomentumMeter value={2} />
        </HStack>
      </Stack>
    );
  },
};

export const AssetMeters: Story = {
  render: () => (
    <HStack gap="2" alignItems="stretch" flexWrap="wrap">
      <ConditionMeter label="Integrity" value={4} max={5} onChange={fn()} />
      <ConditionMeter
        label="Companion Health"
        value={2}
        max={4}
        onChange={fn()}
        onRoll={fn()}
      />
      <ConditionMeter
        label="Disabled"
        value={1}
        max={3}
        disabled
        onChange={fn()}
      />
    </HStack>
  ),
};

/**
 * Adds for the next roll on the meter rollers: the same pill as stat cards
 * and roll buttons, after the value. A meter that does not roll never shows
 * adds.
 */
export const WithAdds: Story = {
  render: () => (
    <HStack gap="2" alignItems="stretch" flexWrap="wrap">
      <ConditionMeter
        label="Health"
        value={3}
        max={5}
        adds={1}
        onChange={fn()}
        onRoll={fn()}
      />
      <ConditionMeter
        label="Spirit"
        value={0}
        max={5}
        warnAtMin
        adds={-1}
        onChange={fn()}
        onRoll={fn()}
      />
      <ConditionMeter
        label="Supply"
        value={4}
        max={5}
        adds={2}
        disabled
        onChange={fn()}
        onRoll={fn()}
      />
      <ConditionMeter
        label="Companion Health"
        value={2}
        max={4}
        adds={1}
        onRoll={fn()}
      />
    </HStack>
  ),
};

/**
 * Adds: set before a roll, shown as the badge on every roll control, added
 * to the next action roll and then reset to 0. A slim strip under the meters,
 * smaller than a meter; once set, the value wears the adds pill's colours.
 */
export const Adds: Story = {
  render: () => (
    <Stack gap="3" width="328px">
      <AddsMeter value={0} onChange={fn()} />
      <AddsMeter value={2} onChange={fn()} />
      <AddsMeter value={-1} onChange={fn()} />
      <AddsMeter value={9} onChange={fn()} />
      <AddsMeter value={1} onChange={fn()} disabled />
      <AddsMeter value={1} />
      <AddsMeter value={0} onChange={fn()} note={null} />
    </Stack>
  ),
};

const kira = sampleCharacters[0];
const statKeys = ["edge", "heart", "iron", "shadow", "wits"] as const;
const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

/**
 * The Meters band of a 328px sidebar, as the game page lays it out: the four
 * meters, then Adds on its own line. Set adds, then roll a stat or a meter:
 * the badge shows on every roll control until the roll uses it, and Adds
 * goes back to 0, as the live app does.
 */
export const AddsClearAfterARoll: Story = {
  render: function Render() {
    const [adds, setAdds] = useState(2);
    const [meters, setMeters] = useState(kira.meters);
    const [lastRoll, setLastRoll] = useState<string>();
    const roll = (name: string, value: number) => {
      setLastRoll(
        adds
          ? `Rolled +${name} (${formatSigned(value)}) with adds ${formatSigned(adds)}. Adds reset to 0.`
          : `Rolled +${name} (${formatSigned(value)}).`,
      );
      setAdds(0);
    };
    return (
      <Stack gap="4" width="328px">
        <StatGrid
          stats={statKeys.map((key) => ({
            key,
            name: capitalize(key),
            value: kira.stats[key],
          }))}
          adds={adds}
          onRoll={(stat) => roll(stat.name, stat.value)}
        />
        <Stack gap="2">
          <HStack gap="2" flexWrap="wrap">
            {(["health", "spirit", "supply"] as const).map((meter) => (
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
                onRoll={() => roll(capitalize(meter), meters[meter])}
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
          </HStack>
          <AddsMeter value={adds} onChange={setAdds} />
        </Stack>
        <Box minHeight="2lh">
          <Text variant="bodySm" color="muted">
            {lastRoll ?? "Roll a stat or a meter."}
          </Text>
        </Box>
      </Stack>
    );
  },
};

/**
 * `stepperSize="touch"`: 44px steppers at any pointer, for a phone sheet that
 * wants plain 44px +/- whatever device previews it. Under a coarse pointer
 * the default steppers grow to 40px on their own.
 */
export const TouchSteppers: Story = {
  render: function Render() {
    const [meters, setMeters] = useState(kira.meters);
    const [adds, setAdds] = useState(1);
    return (
      <Stack gap="2" width="360px">
        <HStack gap="2" flexWrap="wrap">
          {(["health", "spirit", "supply"] as const).map((meter) => (
            <ConditionMeter
              key={meter}
              label={capitalize(meter)}
              value={meters[meter]}
              max={5}
              warnAtMin
              stepperSize="touch"
              onChange={(value) =>
                setMeters((current) => ({ ...current, [meter]: value }))
              }
              onRoll={fn()}
            />
          ))}
          <MomentumMeter
            value={meters.momentum}
            stepperSize="touch"
            onChange={(value) =>
              setMeters((current) => ({ ...current, momentum: value }))
            }
            onBurn={fn()}
          />
        </HStack>
        <AddsMeter value={adds} onChange={setAdds} stepperSize="touch" />
      </Stack>
    );
  },
};
