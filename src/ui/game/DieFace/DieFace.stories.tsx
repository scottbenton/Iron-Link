import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack } from "ui/primitives";

import { Button } from "../../components/Button";
import { DieFace, useDieFace } from "./DieFace";

const meta = {
  title: "Game/DieFace",
  component: DieFace,
  args: { face: 5, size: "md" },
  argTypes: {
    face: { control: { type: "inline-radio" }, options: [1, 2, 3, 4, 5, 6] },
    size: { control: { type: "inline-radio" }, options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof DieFace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change the face to see the crossfade. */
export const Playground: Story = {};

/**
 * `useDieFace` gives a face and a `roll` that always turns it to another
 * one. Each press crossfades to the new face; with reduced motion the face
 * is simply replaced.
 */
export const Rolling: Story = {
  render: function Render() {
    const [face, roll] = useDieFace();
    return (
      <HStack gap="3">
        <DieFace face={face} size="lg" />
        <Button variant="outline" onClick={roll}>
          Roll the die
        </Button>
      </HStack>
    );
  },
};
