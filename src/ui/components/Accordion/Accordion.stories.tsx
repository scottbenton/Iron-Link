import { Lightning, PencilSimple, Trash } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "styled-system/jsx";

import { starforgedRules } from "../../stories/fixtures/datasworn";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "./Accordion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

const categories = (["adventure", "quest", "combat", "fate"] as const).map(
  (key) => {
    const category: Loose = starforgedRules.moves[key];
    return {
      key,
      name: category.name as string,
      moves: Object.values(category.contents as Record<string, Loose>).map(
        (move) => move.name as string,
      ),
    };
  },
);

function Moves() {
  return (
    <Accordion defaultValue={["adventure"]}>
      {categories.map((category) => (
        <AccordionItem key={category.key} value={category.key}>
          <AccordionTrigger
            icon={<Lightning />}
            description={`${category.moves.length} moves`}
          >
            {category.name}
          </AccordionTrigger>
          <AccordionPanel>
            <Text variant="bodySm">{category.moves.join(", ")}</Text>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const meta: Meta<typeof Accordion> = {
  title: "Components/Accordion",
  component: Accordion,
};

export default meta;
type Story = StoryObj<typeof Accordion>;

/** One bordered surface with a hairline between sections. */
export const Default: Story = {
  render: () => (
    <Stack maxWidth="480px">
      <Moves />
    </Stack>
  ),
};

/** Buttons beside a heading sit next to the trigger, never inside it. */
export const WithActions: Story = {
  render: () => (
    <Stack maxWidth="480px">
      <Accordion multiple defaultValue={["vow"]}>
        {[
          { value: "vow", title: "Find the lost colony", rank: "Formidable" },
          { value: "bond", title: "Earn Kira's trust", rank: "Dangerous" },
        ].map((track) => (
          <AccordionItem key={track.value} value={track.value}>
            <AccordionTrigger
              description={track.rank}
              actions={
                <>
                  <IconButton size="sm" label={`Edit ${track.title}`}>
                    <PencilSimple />
                  </IconButton>
                  <IconButton size="sm" label={`Delete ${track.title}`}>
                    <Trash />
                  </IconButton>
                </>
              }
            >
              {track.title}
            </AccordionTrigger>
            <AccordionPanel>
              <Text variant="bodySm">
                Progress: 4 of 10 boxes filled. Mark progress when you overcome
                an obstacle on the way.
              </Text>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Stack>
  ),
};
