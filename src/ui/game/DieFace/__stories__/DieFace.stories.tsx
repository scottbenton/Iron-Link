import { DiceFive } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid, HStack } from "ui/primitives";

import { Button } from "../../../components/Button";
import { Text } from "../../../components/Text";
import {
  DieFace,
  DieFaceMotion,
  DieFaceValue,
  nextDieFace,
  useDieFace,
} from "../DieFace";

const meta = {
  title: "Game/DieFace",
  component: DieFace,
  args: { face: 5, size: "md", weight: "bold", motion: "tilt" },
  argTypes: {
    face: { control: { type: "inline-radio" }, options: [1, 2, 3, 4, 5, 6] },
    size: { control: { type: "inline-radio" }, options: ["sm", "md", "lg"] },
    weight: { control: { type: "inline-radio" }, options: ["bold", "fill"] },
    motion: {
      control: { type: "inline-radio" },
      options: ["swap", "tilt", "pop", "cycle", "fade"],
    },
  },
} satisfies Meta<typeof DieFace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change the face to see the motion. */
export const Playground: Story = {};

/**
 * `useDieFace` gives a face and a `roll` that always turns it to another
 * one. With reduced motion every option simply replaces the face.
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

const motions: { motion: DieFaceMotion; name: string; about: string }[] = [
  {
    motion: "swap",
    name: "Swap",
    about: "The new face replaces the old at once.",
  },
  { motion: "tilt", name: "Tilt", about: "Turns in from 18 degrees, 140ms." },
  { motion: "pop", name: "Pop", about: "Grows in from 75%, 140ms." },
  {
    motion: "cycle",
    name: "Cycle",
    about: "Two random faces, 50ms each, then the new one.",
  },
  { motion: "fade", name: "Fade", about: "Crossfades over the old, 140ms." },
];

/**
 * The options side by side, at the size a roll button draws its die and at
 * a large size. Roll all to see them land together; each changes to the
 * same new face. Only one will stay.
 */
export const MotionOptions: Story = {
  name: "Motion options",
  render: function Render() {
    const [face, setFace] = useState<DieFaceValue>(5);
    const roll = () => setFace(nextDieFace);
    return (
      <Grid gap="4" maxWidth="560px">
        <HStack gap="3">
          <Button
            variant="gradient"
            startIcon={<DiceFive weight="bold" />}
            onClick={roll}
          >
            Roll all
          </Button>
        </HStack>
        {motions.map(({ motion, name, about }) => (
          <Grid
            key={motion}
            gridTemplateColumns="5rem auto auto 1fr"
            alignItems="center"
            gap="4"
          >
            <Text variant="label">{name}</Text>
            <DieFace face={face} motion={motion} />
            <DieFace face={face} motion={motion} size="lg" weight="fill" />
            <Text variant="bodySm" color="muted">
              {about}
            </Text>
          </Grid>
        ))}
      </Grid>
    );
  },
};
