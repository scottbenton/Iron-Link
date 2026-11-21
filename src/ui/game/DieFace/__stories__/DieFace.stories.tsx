import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack } from "ui/primitives";

import { DieFace, DieFaceValue, useDieFace } from "..";
import { Button } from "../../../components/Button";

const meta = {
  title: "Game/DieFace",
  component: DieFace,
  args: { face: 5, size: "md", weight: "bold" },
  argTypes: {
    face: { control: { type: "inline-radio" }, options: [1, 2, 3, 4, 5, 6] },
    size: { control: { type: "inline-radio" }, options: ["sm", "md", "lg"] },
    weight: { control: { type: "inline-radio" }, options: ["bold", "fill"] },
  },
} satisfies Meta<typeof DieFace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change the face to see the die cycle and land on it. */
export const Playground: Story = {};

/**
 * `useDieFace` gives the die's state and a `roll`. Handed an action die (1
 * to 6) the die lands on it, even when it showed that face already; handed
 * nothing, it lands on a new face. With reduced motion it simply shows the
 * new face.
 */
export const Rolling: Story = {
  render: function Render() {
    const [die, roll] = useDieFace();
    const rollD6 = () =>
      roll((Math.floor(Math.random() * 6) + 1) as DieFaceValue);
    return (
      <HStack gap="3">
        <DieFace {...die} size="lg" />
        <Button variant="outline" onClick={rollD6}>
          Roll a d6
        </Button>
        <Button variant="outline" onClick={() => roll(3)}>
          Roll a 3
        </Button>
        <Button variant="outline" onClick={() => roll()}>
          Roll something else
        </Button>
      </HStack>
    );
  },
};

/** A result on its way (a roll saving): the die cycles until it lands. */
export const PendingResult: Story = {
  name: "Pending result",
  render: function Render() {
    const [die, roll] = useDieFace();
    const slowRoll = () =>
      roll(
        new Promise<number>((resolve) =>
          window.setTimeout(
            () => resolve(Math.floor(Math.random() * 6) + 1),
            800,
          ),
        ),
      );
    return (
      <HStack gap="3">
        <DieFace {...die} size="lg" />
        <Button variant="outline" onClick={slowRoll}>
          Roll, with an 800ms save
        </Button>
      </HStack>
    );
  },
};
