import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import { sampleMoves, starforgedRules } from "../../stories/fixtures/datasworn";
import { RulesText } from "./RulesText";

const meta: Meta<typeof RulesText> = {
  title: "Game/RulesText",
  component: RulesText,
  args: {
    markdown: sampleMoves.faceDanger.text,
    size: "md",
    color: "default",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    color: {
      control: "inline-radio",
      options: ["default", "muted", "inherit"],
    },
  },
  render: (args) => (
    <Stack maxWidth="560px">
      <RulesText {...args} />
    </Stack>
  ),
};

export default meta;
type Story = StoryObj<typeof RulesText>;

/** Face Danger: a bold trigger, a list of stats, outcomes. */
export const Playground: Story = {};

/** Ask the Oracle carries its odds as a compact table. */
export const WithTable: Story = {
  args: { markdown: sampleMoves.askTheOracle.text, size: "sm" },
};

/** `datasworn:` links call `onLinkClick` with the id. */
export const Links: Story = {
  render: function Render() {
    const [opened, setOpened] = useState<string | null>(null);
    return (
      <Stack gap="3" maxWidth="560px">
        <RulesText
          markdown={sampleMoves.payThePrice.text}
          onLinkClick={setOpened}
        />
        <Text variant="bodySm" color="muted" role="status">
          {opened ? `Opened ${opened}` : "Press a link"}
        </Text>
      </Stack>
    );
  },
};

/**
 * An oracle table named by a macro renders as a table, given
 * `resolveOracle`.
 */
export const EmbeddedOracleTable: Story = {
  args: {
    size: "sm",
    markdown: `Roll on the table below.\n\n{{table>oracle_rollable:starforged/core/action}}`,
    resolveOracle: (id: string) =>
      id === "oracle_rollable:starforged/core/action"
        ? starforgedRules.oracles.core.contents.action
        : undefined,
  },
};
