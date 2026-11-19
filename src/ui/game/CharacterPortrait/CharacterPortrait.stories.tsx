import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "ui/primitives";
import { schemeNames } from "ui/theme";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { CharacterPortrait } from "./CharacterPortrait";
import { PortraitPlaceholder } from "./PortraitPlaceholder";
import { PortraitSize } from "./portraitData";

const sizes: PortraitSize[] = ["xs", "sm", "md", "lg", "xl"];
const [kira, orrin, senna] = sampleCharacters;

const meta: Meta<typeof CharacterPortrait> = {
  title: "Game/CharacterPortrait",
  component: CharacterPortrait,
  args: { name: kira.name, colorSeed: kira.colorSeed, size: "lg" },
  argTypes: {
    size: { control: "inline-radio", options: sizes },
    shape: { control: "inline-radio", options: ["circle", "rounded"] },
    status: {
      control: "inline-radio",
      options: [undefined, "online", "away", "offline"],
    },
    colorScheme: { control: "select", options: [undefined, ...schemeNames] },
  },
};

export default meta;
type Story = StoryObj<typeof CharacterPortrait>;

export const Playground: Story = {};

/** Every size, initials over a seeded gradient. */
export const Sizes: Story = {
  render: (args) => (
    <HStack gap="4" alignItems="center">
      {sizes.map((size) => (
        <CharacterPortrait key={size} {...args} size={size} />
      ))}
    </HStack>
  ),
};

/** A dot shows who is here. */
export const Status: Story = {
  render: () => (
    <HStack gap="5" alignItems="center">
      <CharacterPortrait
        name={kira.name}
        colorSeed={kira.colorSeed}
        size="lg"
        status="online"
        statusLabel="Online"
      />
      <CharacterPortrait
        name={orrin.name}
        colorSeed={orrin.colorSeed}
        size="lg"
        status="away"
        statusLabel="Away"
      />
      <CharacterPortrait
        name={senna.name}
        colorSeed={senna.colorSeed}
        size="lg"
        status="offline"
        statusLabel="Offline"
      />
    </HStack>
  ),
};

/** Tinted by a colour scheme instead of a seed, square-cornered. */
export const SchemeTinted: Story = {
  render: () => (
    <HStack gap="4">
      {(["default", "cinder", "eidolon", "orchid"] as const).map((scheme) => (
        <CharacterPortrait
          key={scheme}
          name={kira.name}
          colorScheme={scheme}
          shape="rounded"
          size="lg"
        />
      ))}
    </HStack>
  ),
};

export const Loading: Story = { args: { loading: true } };

/** In place of a portrait, to upload one. */
export const Placeholder: Story = {
  render: () => (
    <Stack gap="4">
      <HStack gap="4" alignItems="center">
        <PortraitPlaceholder size="md" />
        <PortraitPlaceholder size="lg" />
        <PortraitPlaceholder size="xl" />
        <PortraitPlaceholder size="xl" shape="rounded" />
      </HStack>
    </Stack>
  ),
};
