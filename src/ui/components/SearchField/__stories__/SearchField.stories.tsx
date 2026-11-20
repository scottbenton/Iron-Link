import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "ui/primitives";

import { SearchField } from "../SearchField";

const moves = [
  "Face Danger",
  "Secure an Advantage",
  "Gather Information",
  "Heal",
  "Resupply",
  "Make Camp",
  "Undertake a Journey",
  "Swear an Iron Vow",
  "Fulfill Your Vow",
];

const meta = {
  title: "Components/SearchField",
  component: SearchField,
  args: { label: "Search moves", placeholder: "Search moves" },
  decorators: [
    (Story) => (
      <Stack maxWidth="360px">
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Escape clears the query; on an empty field it passes on. */
export const FilteringMoves: Story = {
  render: function Render(args) {
    const [query, setQuery] = useState("");
    const results = moves.filter((move) =>
      move.toLowerCase().includes(query.trim().toLowerCase()),
    );
    return (
      <Stack gap="3">
        <SearchField {...args} value={query} onValueChange={setQuery} />
        <ul style={{ margin: 0, paddingInlineStart: "1.25rem" }}>
          {results.map((move) => (
            <li key={move}>{move}</li>
          ))}
        </ul>
        {results.length === 0 && <p>No moves match “{query}”.</p>}
      </Stack>
    );
  },
};

export const Small: Story = {
  args: { size: "sm", label: "Search oracles", placeholder: "Search oracles" },
};
