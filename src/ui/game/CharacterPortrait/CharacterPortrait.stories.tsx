import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "ui/primitives";
import { schemeNames } from "ui/theme";

import {
  sampleCharacters,
  samplePortraitSrc,
} from "../../stories/fixtures/characters";
import { CharacterPortrait } from "./CharacterPortrait";
import { PortraitPlaceholder } from "./PortraitPlaceholder";
import { PortraitSize } from "./portraitData";

const sizes: PortraitSize[] = ["xs", "sm", "md", "lg", "xl"];
const [kira, orrin, senna] = sampleCharacters;

const meta: Meta<typeof CharacterPortrait> = {
  title: "Game/CharacterPortrait",
  component: CharacterPortrait,
  args: { name: kira.name, size: "lg" },
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

/** Every size, initials in a gray ring. */
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
        size="lg"
        status="online"
        statusLabel="Online"
      />
      <CharacterPortrait
        name={orrin.name}
        size="lg"
        status="away"
        statusLabel="Away"
      />
      <CharacterPortrait
        name={senna.name}
        size="lg"
        status="offline"
        statusLabel="Offline"
      />
    </HStack>
  ),
};

/**
 * A colour scheme rings the portrait in its colour, as the app does today.
 * The face inside stays neutral, with or without an image.
 */
export const SchemeRing: Story = {
  render: () => (
    <Stack gap="4" alignItems="start">
      {[undefined, samplePortraitSrc].map((portraitUrl) => (
        <HStack key={portraitUrl ?? "initials"} gap="4">
          {(["default", "cinder", "eidolon", "orchid"] as const).map(
            (scheme) => (
              <CharacterPortrait
                key={scheme}
                name={kira.name}
                portraitUrl={portraitUrl}
                colorScheme={scheme}
                size="lg"
              />
            ),
          )}
        </HStack>
      ))}
    </Stack>
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
