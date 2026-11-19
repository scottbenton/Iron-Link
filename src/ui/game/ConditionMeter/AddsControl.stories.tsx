import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Box, HStack, Stack } from "ui/primitives";

import { Text } from "../../components/Text";
import { sampleCharacters } from "../../stories/fixtures/characters";
import { sampleMoves } from "../../stories/fixtures/datasworn";
import { StatGrid } from "../StatCard";
import { capitalize, formatSigned } from "../shared/format";
import { AddsControl } from "./AddsControl";
import { ConditionMeter } from "./ConditionMeter";
import { MomentumMeter } from "./MomentumMeter";

const meta = {
  title: "Game/AddsControl",
  component: AddsControl,
  args: { value: 0, onChange: fn() },
  argTypes: {
    value: { control: { type: "number", min: -9, max: 9 } },
    stepperSize: { control: "inline-radio", options: ["sm", "touch"] },
  },
} satisfies Meta<typeof AddsControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <AddsControl {...args} value={value} onChange={setValue} />;
  },
};

const Caption = (props: { children: string }) => (
  <Text variant="caption" color="muted">
    {props.children}
  </Text>
);

/**
 * The chip at 0, +2 and −1: grey at 0; once set, the chip takes the accent's
 * soft tint and the value the same solid pill as the badge on every stat
 * and meter. Then the limits, blocked, read-only and without its hint (no
 * help button). The help button opens a popover saying what adds do; it
 * works on a tap, where a tooltip would not.
 */
export const Values: Story = {
  render: () => (
    <Stack gap="4" width="328px">
      <Stack gap="1">
        <AddsControl value={0} onChange={fn()} />
        <Caption>0, nothing on the next roll</Caption>
      </Stack>
      <Stack gap="1">
        <AddsControl value={2} onChange={fn()} />
        <Caption>+2</Caption>
      </Stack>
      <Stack gap="1">
        <AddsControl value={-1} onChange={fn()} />
        <Caption>−1</Caption>
      </Stack>
      <Stack gap="1">
        <AddsControl value={9} onChange={fn()} />
        <Caption>+9, the most: Add is blocked</Caption>
      </Stack>
      <Stack gap="1">
        <AddsControl value={1} onChange={fn()} disabled />
        <Caption>Disabled, such as while a roll is saving</Caption>
      </Stack>
      <Stack gap="1">
        <AddsControl value={1} />
        <Caption>Read-only, for someone else&apos;s character</Caption>
      </Stack>
      <Stack gap="1">
        <AddsControl value={0} onChange={fn()} hint={null} />
        <Caption>No hint, so no help button</Caption>
      </Stack>
    </Stack>
  ),
};

/**
 * Narrow rooms: the chip stays one line, since the hint lives in the help
 * popover, and a long translated hint wraps there instead.
 */
export const Narrow: Story = {
  render: () => (
    <Stack gap="4">
      <Box width="220px">
        <AddsControl value={2} onChange={fn()} />
      </Box>
      <Box width="328px">
        <AddsControl
          value={-2}
          onChange={fn()}
          label="Bonus"
          hint="Added to your next action roll, whichever stat or meter it uses, then reset to 0"
        />
      </Box>
    </Stack>
  ),
};

/** `stepperSize="touch"`: 44px steppers at any pointer, for the phone sheet. */
export const TouchSteppers: Story = {
  render: function Render() {
    const [adds, setAdds] = useState(1);
    return (
      <Box width="360px">
        <AddsControl value={adds} onChange={setAdds} stepperSize="touch" />
      </Box>
    );
  },
};

const kira = sampleCharacters[0];
const statKeys = ["edge", "heart", "iron", "shadow", "wits"] as const;
const meterKeys = ["health", "spirit", "supply"] as const;

/**
 * Where it sits: above the stats, since adds change whichever stat or meter
 * the next roll uses, in a 328px sidebar with its label lined up with the
 * section bands' text. Set adds and watch the badges come in on every stat
 * and meter roller; roll one with Face Danger and Adds goes back to 0, as
 * the live app does.
 */
export const AboveTheStats: Story = {
  render: function Render() {
    const [adds, setAdds] = useState(0);
    const [meters, setMeters] = useState(kira.meters);
    const [lastRoll, setLastRoll] = useState<string>();
    const roll = (name: string, value: number) => {
      setLastRoll(
        adds
          ? `${sampleMoves.faceDanger.name} +${name} (${formatSigned(value)}) with adds ${formatSigned(adds)}. Adds reset to 0.`
          : `${sampleMoves.faceDanger.name} +${name} (${formatSigned(value)}).`,
      );
      setAdds(0);
    };
    return (
      <Stack gap="3" width="328px">
        <AddsControl value={adds} onChange={setAdds} />
        <StatGrid
          stats={statKeys.map((key) => ({
            key,
            name: capitalize(key),
            value: kira.stats[key],
          }))}
          adds={adds}
          onRoll={(stat) => roll(stat.name, stat.value)}
        />
        <HStack gap="2" flexWrap="wrap">
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
              onRoll={() => roll(capitalize(meter), meters[meter])}
            />
          ))}
          <MomentumMeter
            value={meters.momentum}
            onChange={(value) =>
              setMeters((current) => ({ ...current, momentum: value }))
            }
            onBurn={() => setMeters((current) => ({ ...current, momentum: 2 }))}
          />
        </HStack>
        <Box minHeight="2lh">
          <Text variant="bodySm" color="muted">
            {lastRoll ?? "Set adds, then roll a stat or a meter."}
          </Text>
        </Box>
      </Stack>
    );
  },
};
