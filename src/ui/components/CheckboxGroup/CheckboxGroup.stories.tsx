import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Checkbox } from "../Checkbox";
import { CheckboxGroup } from "./CheckboxGroup";

const meta = {
  title: "Components/CheckboxGroup",
  component: CheckboxGroup,
  args: {
    label: "Expansions",
    description: "Their moves, assets and oracles are added to the game.",
    children: null,
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <CheckboxGroup {...args} defaultValue={["delve"]}>
      <Checkbox value="delve" label="Ironsworn: Delve" />
      <Checkbox value="lodestar" label="Ironsworn: Lodestar" />
      <Checkbox value="starsmith" label="Starsmith" />
    </CheckboxGroup>
  ),
};

/**
 * `allLabel` puts a "select all" checkbox above the choices, which nest
 * under it. One press ticks them all; when all are ticked, one press clears
 * them. It shows a dash while only some are ticked.
 */
export const SelectAll: Story = {
  render: function Render() {
    const all = ["health", "spirit", "supply"];
    const [value, setValue] = useState<string[]>(["health"]);
    return (
      <CheckboxGroup
        label="Reset meters"
        value={value}
        onValueChange={setValue}
        allLabel="All meters"
        allValues={all}
      >
        <Checkbox value="health" label="Health" />
        <Checkbox value="spirit" label="Spirit" />
        <Checkbox value="supply" label="Supply" />
      </CheckboxGroup>
    );
  },
};

/**
 * The group's help sits under its legend. Each choice's description sits
 * under its title, and pressing it toggles the choice.
 */
export const WithDescriptions: Story = {
  render: () => (
    <CheckboxGroup
      label="Player permissions"
      description="Guides can always do these."
      defaultValue={["add-notes"]}
    >
      <Checkbox
        value="edit-sheets"
        label="Edit their character sheets"
        description="Stats, meters, assets and vows."
      />
      <Checkbox
        value="add-notes"
        label="Add shared notes"
        description="Notes every player in the game can read."
      />
      <Checkbox
        value="roll-oracles"
        label="Roll oracles"
        description="Results are posted to the game log."
      />
    </CheckboxGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <CheckboxGroup
      label="Show in log"
      orientation="horizontal"
      defaultValue={["rolls"]}
    >
      <Checkbox value="rolls" label="Rolls" />
      <Checkbox value="moves" label="Moves" />
      <Checkbox value="notes" label="Notes" />
    </CheckboxGroup>
  ),
};

export const Invalid: Story = {
  render: () => (
    <CheckboxGroup
      label="Player permissions"
      required
      description="Guides can always do these."
      error="Choose at least one thing players may do."
    >
      <Checkbox value="edit-sheets" label="Edit their character sheets" />
      <Checkbox value="add-notes" label="Add shared notes" />
    </CheckboxGroup>
  ),
};
