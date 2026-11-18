import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Text } from "ui/components/Text";

import { Stack } from "styled-system/jsx";

import { starforgedRules } from "../../stories/fixtures/datasworn";
import { OracleListItem } from "./OracleListItem";

const core = starforgedRules.oracles.core.contents;

const meta: Meta<typeof OracleListItem> = {
  title: "Game/OracleListItem",
  component: OracleListItem,
  args: { name: "Action" },
};

export default meta;
type Story = StoryObj<typeof OracleListItem>;

/** Rows as in the oracle drawer: press to roll, the table icon to look. */
export const List: Story = {
  render: function Render() {
    const [last, setLast] = useState<string>();
    return (
      <Stack gap="3" maxWidth="360px">
        <Stack
          gap="0"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="lg"
          overflow="hidden"
        >
          {Object.values(core).map((oracle) => {
            const { _id, name } = oracle as { _id: string; name: string };
            return (
              <OracleListItem
                key={_id}
                name={name}
                onRoll={() => setLast(name)}
                onViewTable={() => setLast(`${name} table`)}
              />
            );
          })}
        </Stack>
        <Text variant="bodySm" color="muted" role="status">
          {last ? `Opened ${last}` : "Nothing rolled yet"}
        </Text>
      </Stack>
    );
  },
};

export const Disabled: Story = {
  args: { onRoll: () => {}, disabled: true },
  render: (args) => (
    <Stack maxWidth="360px">
      <OracleListItem {...args} />
    </Stack>
  ),
};
