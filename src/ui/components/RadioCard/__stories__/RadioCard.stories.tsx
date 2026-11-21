import { User, UserCircleGear, UsersThree } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { RadioCard, RadioCardGroup } from "..";
import { Button } from "../../Button";

type GameType = "solo" | "co-op" | "guided";

const meta = {
  title: "Components/RadioCard",
  component: RadioCardGroup,
  args: { label: "Game type", children: null },
} satisfies Meta<typeof RadioCardGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function GameTypeCards() {
  return (
    <>
      <RadioCard<GameType>
        value="solo"
        title="Solo"
        icon={<User />}
        description="One character, you and the oracles."
      />
      <RadioCard<GameType>
        value="co-op"
        title="Co-op"
        icon={<UsersThree />}
        description="A few characters sharing vows and the story, with no Guide."
      />
      <RadioCard<GameType>
        value="guided"
        title="Guided"
        icon={<UserCircleGear />}
        description="A Guide runs the world and keeps secrets from the players."
      />
    </>
  );
}

export const GameTypes: Story = {
  render: function Render() {
    const [type, setType] = useState<GameType>("solo");
    return (
      <RadioCardGroup<GameType>
        label="Game type"
        description="Decides who can see what, and whether a Guide runs the world."
        value={type}
        onValueChange={setType}
        columns={3}
      >
        <GameTypeCards />
      </RadioCardGroup>
    );
  },
};

export const Rulesets: Story = {
  render: () => (
    <RadioCardGroup
      label="Ruleset"
      defaultValue="starforged"
      minCardWidth="220px"
    >
      <RadioCard
        value="ironsworn"
        title="Ironsworn"
        description="Dark fantasy in the Ironlands."
      />
      <RadioCard
        value="starforged"
        title="Starforged"
        description="Science fiction in the Forge."
      />
      <RadioCard
        value="sundered-isles"
        title="Sundered Isles"
        description="Seafaring adventure. Needs Starforged."
        footer={
          <Button variant="text" size="sm">
            Read about Sundered Isles
          </Button>
        }
      />
    </RadioCardGroup>
  ),
};

/** `size="sm"` for a grid of short choices, such as the colour schemes. */
export const Small: Story = {
  render: () => (
    <RadioCardGroup
      label="Starting momentum"
      defaultValue="2"
      minCardWidth="120px"
    >
      {["0", "1", "2", "3"].map((value) => (
        <RadioCard key={value} value={value} title={`+${value}`} size="sm" />
      ))}
    </RadioCardGroup>
  ),
};

export const DisabledCard: Story = {
  render: () => (
    <RadioCardGroup<GameType> label="Game type" defaultValue="solo" columns={3}>
      <RadioCard<GameType> value="solo" title="Solo" icon={<User />} />
      <RadioCard<GameType> value="co-op" title="Co-op" icon={<UsersThree />} />
      <RadioCard<GameType>
        value="guided"
        title="Guided"
        icon={<UserCircleGear />}
        description="Guided games need an account with a display name."
        disabled
      />
    </RadioCardGroup>
  ),
};

export const Invalid: Story = {
  render: () => (
    <RadioCardGroup<GameType>
      label="Game type"
      required
      columns={3}
      error="Choose how this game is played."
    >
      <GameTypeCards />
    </RadioCardGroup>
  ),
};
