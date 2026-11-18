import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { starforgedRules } from "../../stories/fixtures/datasworn";
import { Text } from "../Text";
import { ScrollArea } from "./ScrollArea";

const themes: { text: string }[] =
  starforgedRules.oracles.core.contents.theme.rows;

const meta: Meta<typeof ScrollArea> = {
  title: "Components/ScrollArea",
  component: ScrollArea,
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const box = css({
  height: "240px",
  width: "280px",
  border: "1px solid token(colors.border.default)",
  borderRadius: "lg",
  background: "bg.surface",
});

export const Vertical: Story = {
  render: () => (
    <ScrollArea aria-label="Theme oracle" className={box} fade>
      <Stack gap="2" padding="3">
        {themes.map((row, index) => (
          <Text key={index} variant="bodySm">
            {row.text}
          </Text>
        ))}
      </Stack>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea
      aria-label="Theme oracle"
      orientation="horizontal"
      fade
      className={css({
        width: "360px",
        border: "1px solid token(colors.border.default)",
        borderRadius: "lg",
      })}
    >
      <HStack gap="2" padding="3" width="max-content">
        {themes.map((row, index) => (
          <Text key={index} variant="label">
            {row.text}
          </Text>
        ))}
      </HStack>
    </ScrollArea>
  ),
};
