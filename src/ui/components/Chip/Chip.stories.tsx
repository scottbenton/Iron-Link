import {
  CompassIcon,
  FireIcon,
  ShieldIcon,
  SkullIcon,
  SwordIcon,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HStack, Stack } from "ui/primitives";

import { Chip } from "./Chip";

const meta = {
  title: "Components/Chip",
  component: Chip,
  parameters: { layout: "centered" },
  args: { children: "Ironsworn" },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <Stack gap="3">
      {(["outline", "soft"] as const).map((variant) => (
        <HStack key={variant} gap="2" flexWrap="wrap">
          <Chip variant={variant}>Neutral</Chip>
          <Chip variant={variant} tone="accent" icon={<CompassIcon />}>
            Starforged
          </Chip>
          <Chip variant={variant} tone="success">
            Fulfilled
          </Chip>
          <Chip variant={variant} tone="warning">
            Wounded
          </Chip>
          <Chip variant={variant} tone="danger" icon={<FireIcon />}>
            Battered
          </Chip>
          <Chip variant={variant} tone="info">
            Guide only
          </Chip>
          <Chip variant={variant} tone="cursed" icon={<SkullIcon />}>
            Cursed
          </Chip>
        </HStack>
      ))}
    </Stack>
  ),
};

/** Toggle chips filter a list; each is a button with aria-pressed. */
export const Filters: Story = {
  render: function Render() {
    const [chosen, setChosen] = useState<string[]>(["Combat"]);
    const toggle = (name: string) =>
      setChosen((current) =>
        current.includes(name)
          ? current.filter((item) => item !== name)
          : [...current, name],
      );
    return (
      <HStack gap="2" flexWrap="wrap">
        {[
          { name: "Combat", icon: <SwordIcon /> },
          { name: "Adventure", icon: <CompassIcon /> },
          { name: "Suffer", icon: <ShieldIcon /> },
        ].map(({ name, icon }) => (
          <Chip
            key={name}
            icon={icon}
            selected={chosen.includes(name)}
            onClick={() => toggle(name)}
          >
            {name}
          </Chip>
        ))}
      </HStack>
    );
  },
};

/** Removable chips name their remove button ("Remove Ironclad"). */
export const Removable: Story = {
  render: function Render() {
    const [assets, setAssets] = useState(["Ironclad", "Hawk", "Swordmaster"]);
    return (
      <HStack gap="2" flexWrap="wrap">
        {assets.map((asset) => (
          <Chip
            key={asset}
            tone="accent"
            variant="soft"
            onRemove={() =>
              setAssets((current) => current.filter((item) => item !== asset))
            }
          >
            {asset}
          </Chip>
        ))}
        <Chip size="sm" onRemove={() => {}}>
          Small
        </Chip>
      </HStack>
    );
  },
};
