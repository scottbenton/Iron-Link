import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { HStack, Stack } from "styled-system/jsx";

import { sampleCharacters } from "../../stories/fixtures/characters";
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

const kira = sampleCharacters[0];
const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

/**
 * `stepperSize="touch"`: 44px steppers at any pointer, for a phone sheet that
 * wants plain 44px +/- whatever device previews it. Under a coarse pointer
 * the default steppers grow to 40px on their own.
 */
export const TouchSteppers: Story = {
  render: function Render() {
    const [meters, setMeters] = useState(kira.meters);
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
      </Stack>
    );
  },
};
