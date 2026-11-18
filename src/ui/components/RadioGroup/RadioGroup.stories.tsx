import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Radio, RadioGroup } from "./RadioGroup";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  args: { label: "Ruleset", children: null },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <RadioGroup {...args} defaultValue="ironsworn">
      <Radio value="ironsworn" label="Ironsworn" />
      <Radio value="starforged" label="Starforged" />
      <Radio value="sundered-isles" label="Sundered Isles" />
    </RadioGroup>
  ),
};

export const WithDescriptions: Story = {
  render: function Render() {
    const [type, setType] = useState("solo");
    return (
      <RadioGroup
        label="Game type"
        description="You can change it later in the game's settings."
        value={type}
        onValueChange={setType}
      >
        <Radio
          value="solo"
          label="Solo"
          description="One character, you and the oracles."
        />
        <Radio
          value="co-op"
          label="Co-op"
          description="A few characters, sharing vows and the story."
        />
        <Radio
          value="guided"
          label="Guided"
          description="A Guide runs the world for the players."
        />
      </RadioGroup>
    );
  },
};

/** The small size, with descriptions. */
export const Small: Story = {
  render: () => (
    <RadioGroup label="Progress rank" size="sm" defaultValue="dangerous">
      <Radio
        value="troublesome"
        label="Troublesome"
        description="Mark 3 boxes of progress"
      />
      <Radio
        value="dangerous"
        label="Dangerous"
        description="Mark 2 boxes of progress"
      />
      <Radio
        value="formidable"
        label="Formidable"
        description="Mark 1 box of progress"
      />
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup
      label="Progress rank"
      orientation="horizontal"
      defaultValue="dangerous"
    >
      <Radio value="troublesome" label="Troublesome" />
      <Radio value="dangerous" label="Dangerous" />
      <Radio value="formidable" label="Formidable" />
      <Radio value="extreme" label="Extreme" />
      <Radio value="epic" label="Epic" disabled />
    </RadioGroup>
  ),
};

export const Invalid: Story = {
  render: () => (
    <RadioGroup
      label="Stat"
      required
      description="Roll with the stat that fits how you act."
      orientation="horizontal"
      error="Choose the stat to roll with."
    >
      <Radio value="edge" label="Edge" />
      <Radio value="heart" label="Heart" />
      <Radio value="iron" label="Iron" />
      <Radio value="shadow" label="Shadow" />
      <Radio value="wits" label="Wits" />
    </RadioGroup>
  ),
};
