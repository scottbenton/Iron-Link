import { Compass, Mountains, Sword } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "styled-system/jsx";

import { Select, SelectOptions, SelectProps } from "./Select";

type SingleSelectProps<V extends string> = Extract<
  SelectProps<V>,
  { multiple?: false }
>;

type Ruleset = "ironsworn" | "starforged" | "sundered-isles";

const rulesets: SelectOptions<Ruleset> = [
  {
    value: "ironsworn",
    label: "Ironsworn",
    description: "Dark fantasy in the Ironlands",
    icon: <Mountains />,
  },
  {
    value: "starforged",
    label: "Starforged",
    description: "Science fiction in the Forge",
    icon: <Compass />,
  },
  {
    value: "sundered-isles",
    label: "Sundered Isles",
    description: "Seafaring adventure, a Starforged expansion",
    icon: <Sword />,
  },
];

const oracleTables: SelectOptions = [
  {
    label: "Action and Theme",
    options: [
      { value: "action", label: "Action" },
      { value: "theme", label: "Theme" },
    ],
  },
  {
    label: "Characters",
    options: [
      { value: "character-role", label: "Role" },
      { value: "character-goal", label: "Goal" },
      { value: "character-descriptor", label: "Descriptor" },
      { value: "ironlander-names", label: "Ironlander Names" },
      { value: "elf-names", label: "Elf Names", disabled: true },
    ],
  },
  {
    label: "Places",
    options: [
      { value: "region", label: "Region" },
      { value: "location", label: "Location" },
      { value: "coastal-waters", label: "Coastal Waters Location" },
      { value: "location-descriptor", label: "Location Descriptor" },
    ],
  },
];

const meta = {
  title: "Components/Select",
  render: (args) => <Select<Ruleset> {...args} />,
  args: {
    label: "Ruleset",
    options: rulesets,
    placeholder: "Choose a ruleset",
  },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md"] } },
  decorators: [
    (Story) => (
      <Stack maxWidth="360px">
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<SingleSelectProps<Ruleset>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const RulesetChoice: Story = {
  render: function Render(args) {
    const [ruleset, setRuleset] = useState<Ruleset | null>("starforged");
    return (
      <Select<Ruleset>
        {...args}
        value={ruleset}
        onValueChange={setRuleset}
        description="Sets the moves, oracles and assets for this game."
      />
    );
  },
};

/** Grouped options with labels; Elf Names is disabled. */
export const OracleTable: Story = {
  render: () => (
    <Select
      label="Oracle Table"
      placeholder="Choose a table"
      options={oracleTables}
      defaultValue="character-goal"
    />
  ),
};

export const Multiple: Story = {
  render: () => (
    <Select<Ruleset>
      multiple
      label="Rules Packages"
      options={rulesets}
      defaultValue={["starforged", "sundered-isles"]}
    />
  ),
};

export const States: Story = {
  render: () => (
    <Stack gap="4">
      <Select<Ruleset>
        label="Ruleset"
        options={rulesets}
        placeholder="Choose a ruleset"
        required
        error="Choose a ruleset to create the game."
      />
      <Select<Ruleset>
        label="Ruleset"
        options={rulesets}
        defaultValue="ironsworn"
        readOnly
        description="The ruleset can't change once a game has started."
      />
      <Select<Ruleset>
        label="Ruleset"
        options={rulesets}
        defaultValue="ironsworn"
        disabled
      />
      <Select<Ruleset>
        size="sm"
        label="Small"
        options={rulesets}
        defaultValue="starforged"
      />
    </Stack>
  ),
};
