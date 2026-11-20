import { PencilSimpleIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BreadcrumbItem, Breadcrumbs } from "../../../components/Breadcrumbs";
import { Button } from "../../../components/Button";
import { IconButton } from "../../../components/IconButton";
import { heroImageSrc } from "../../Examples/storyData";
import { PageHeader } from "../PageHeader";

const meta: Meta<typeof PageHeader> = {
  title: "Layout/PageHeader",
  component: PageHeader,
  parameters: { layout: "fullscreen" },
  args: {
    title: "The Iron Expanse",
    eyebrow: "Starforged",
    subtitle: ["Guided", "4 players", "Last played 2 days ago"],
    titleAs: "h1",
  },
  argTypes: {
    titleAs: { control: "inline-radio", options: ["h1", "h2"] },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Playground: Story = {};

/** A description under the title, and the page's main actions. */
export const WithActions: Story = {
  args: {
    eyebrow: undefined,
    title: "Games",
    subtitle: undefined,
    description: "Pick up where you left off, or start something new.",
    actions: <Button variant="primary">New Game</Button>,
  },
};

/** Where the page sits, over its title. */
export const WithBreadcrumbs: Story = {
  args: {
    eyebrow: "Settlement",
    title: "Bleakhold Station",
    subtitle: ["Orbital", "Population: Thousands"],
    breadcrumbs: (
      <Breadcrumbs>
        <BreadcrumbItem href="#worlds">Worlds</BreadcrumbItem>
        <BreadcrumbItem href="#ashes">Ashes of the Forge</BreadcrumbItem>
        <BreadcrumbItem current>Bleakhold Station</BreadcrumbItem>
      </Breadcrumbs>
    ),
    actions: (
      <>
        <IconButton label="Share">
          <ShareNetworkIcon />
        </IconButton>
        <Button>
          <PencilSimpleIcon />
          Edit
        </Button>
      </>
    ),
  },
};

/** A world or a game with cover art: the image is a band over the header. */
export const WithHeroImage: Story = {
  args: {
    eyebrow: "World",
    title: "Ashes of the Forge",
    subtitle: ["Ironsworn", "12 entries"],
    heroImage: { src: heroImageSrc, alt: "" },
  },
};

/** An h2 for a header inside a page that already has its h1. */
export const SectionLevel: Story = {
  args: {
    titleAs: "h2",
    eyebrow: undefined,
    title: "Characters",
    subtitle: undefined,
    divider: true,
  },
};
